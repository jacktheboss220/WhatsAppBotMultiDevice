import getConnectionUpdate from "./connectionUpdate.js";
import getCommand from "./messages.js";
import getGroupEvent from "./groupEvent.js";
import getCallEvent from "./callEvents.js";
import groupMetaStore from "../cache/groupMetaStore.js";
import { setGroupMeta, delGroupMeta, isRedisEnabled } from "../cache/redisCache.js";

// Group metadata entries live 1h; warming only once at connect meant every group expired together
// ~1h later and the next message in each (worst: 900-member groups) paid a live fetch. Re-warm just
// before expiry. Module-level so a reconnect replaces the timer instead of stacking another.
const WARM_EVERY_MS = 50 * 60 * 1000;
let warmTimer = null;

const warmGroups = (sock, cache) =>
  sock
    .groupFetchAllParticipating()
    .then((groups) => {
      // Groups the bot left / was removed from must not stay cached (sends to them 406)
      for (const jid of groupMetaStore.keys()) {
        if (!groups[jid]) {
          groupMetaStore.del(jid);
          cache.del(jid + ":groupMetadata");
          delGroupMeta(jid);
        }
      }
      for (const [jid, meta] of Object.entries(groups)) {
        groupMetaStore.set(jid, meta);
        if (isRedisEnabled) setGroupMeta(jid, meta); // survives restarts; never rejects
        cache.set(jid + ":groupMetadata", meta, 60 * 60);
      }
      console.log(`⚡ Warmed metadata for ${Object.keys(groups).length} groups`);
    })
    .catch((e) => console.error("Group warm-up failed:", e.message));

const events = async (sock, startSock, cache) => {
  sock.ev.process(async (event) => {
    try {
      if (event["messages.upsert"]) {
        const { type, messages } = event["messages.upsert"];
        if (type === "notify") {
          const validMessages = messages.filter(
            (msg) =>
              msg &&
              msg.message &&
              msg.key?.remoteJid &&
              !msg.key.fromMe &&
              Object.keys(msg.message).length > 0,
          );

          await Promise.all(
            validMessages.map((msg) =>
              getCommand(sock, msg, cache).catch((err) => {
                console.error("Error processing message:", err);
                console.error("Message key:", msg.key);
              }),
            ),
          );
        }
      }

      if (event["connection.update"]) {
        await getConnectionUpdate(startSock, event["connection.update"]);
        if (event["connection.update"].connection === "open") {
          // Pre-load every group so the first message after a restart isn't slow (not awaited)
          warmGroups(sock, cache);
          clearInterval(warmTimer);
          warmTimer = setInterval(() => warmGroups(sock, cache), WARM_EVERY_MS).unref();
        }
      }

      if (event["group-participants.update"]) {
        await getGroupEvent(sock, event["group-participants.update"], cache);
      }

      if (event["call"]) {
        await getCallEvent(sock, event["call"]);
      }
    } catch (err) {
      console.error("Error processing event:", err);
      console.error("Event type:", Object.keys(event));
    }
  });
};

export default events;
