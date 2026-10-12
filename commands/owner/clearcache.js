import groupMetaStore from "../../cache/groupMetaStore.js";
import userDevicesCache from "../../cache/userDevicesCache.js";
import { clearGroupMeta, isRedisEnabled } from "../../cache/redisCache.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping, cache } = msgInfoObj;

  try {
    const mem = cache.keys().length + groupMetaStore.keys().length;
    cache.flushAll();
    groupMetaStore.flushAll();
    // Redis (or the in-memory fallback) group metadata + Baileys device lists. Rate limits and queues are left alone.
    const gm = await clearGroupMeta();
    const ud = await userDevicesCache.flushAll();

    const text =
      `🧹 *Cache cleared*\n` +
      `• Memory: ${mem} entries\n` +
      `• Group metadata: ${gm}\n` +
      `• Device lists (Redis): ${isRedisEnabled ? ud : "n/a"}\n\n` +
      `_Next send in each group re-fetches from WhatsApp, so expect it to be slower once._`;
    return sendMessageWTyping(from, { text }, { quoted: msg });
  } catch (err) {
    console.error("[clearcache]", err);
    return sendMessageWTyping(
      from,
      { text: "❌ Failed to clear cache: " + err.message },
      { quoted: msg },
    );
  }
};

export default () => ({
  cmd: ["clearcache", "flushcache"],
  desc: "Clear group metadata and device caches (memory + Redis).",
  usage: "clearcache",
  handler,
});
