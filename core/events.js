import getConnectionUpdate from "./connectionUpdate.js";
import getCommand from "./messages.js";
import getGroupEvent from "./groupEvent.js";
import getCallEvent from "./callEvents.js";
import groupMetaStore from "../cache/groupMetaStore.js";

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
							Object.keys(msg.message).length > 0
					);

					await Promise.all(
						validMessages.map((msg) =>
							getCommand(sock, msg, cache).catch((err) => {
								console.error("Error processing message:", err);
								console.error("Message key:", msg.key);
							})
						)
					);
				}
			}

			if (event["connection.update"]) {
				await getConnectionUpdate(startSock, event["connection.update"]);
				if (event["connection.update"].connection === "open") {
					// Pre-load every group so the first message after a restart isn't slow (not awaited)
					sock.groupFetchAllParticipating()
						.then((groups) => {
							for (const [jid, meta] of Object.entries(groups)) {
								groupMetaStore.set(jid, meta);
								cache.set(jid + ":groupMetadata", meta, 60 * 60);
							}
							console.log(`⚡ Warmed metadata for ${Object.keys(groups).length} groups`);
						})
						.catch((e) => console.error("Group warm-up failed:", e.message));
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
