import getConnectionUpdate from "./getConnectionUpdateEvent.js";
import getCommand from "./getMessagesEvent.js";
import getGroupEvent from "./getGroupEvent.js";
import getCallEvent from "./getCallEvents.js";

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

					for (const msg of validMessages) {
						try {
							await getCommand(sock, msg, cache);
						} catch (err) {
							console.error("Error processing message:", err);
							console.error("Message key:", msg.key);
						}
					}
				}
			}

			if (event["connection.update"]) {
				await getConnectionUpdate(startSock, event["connection.update"]);
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
