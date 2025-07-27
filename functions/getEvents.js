const getConnectionUpdate = require("./getConnectionUpdateEvent");
const getCommand = require("./getMessagesEvent");
const getGroupEvent = require("./getGroupEvent");
const getCallEvent = require("./getCallEvents");

const events = async (sock, startSock, cache) => {
	sock.ev.process(async (event) => {
		try {
			if (event["messages.upsert"]) {
				const upsert = event["messages.upsert"];
				if (upsert.type === "notify") {
					for (const msg of upsert.messages) {
						if (!msg || !msg.message || !msg.key || !msg.key.remoteJid) {
							continue;
						}

						const messageContent = JSON.stringify(msg.message);
						if (messageContent === "{}" || messageContent === "null" || messageContent === "undefined") {
							continue;
						}

						const isFromBot = msg.key.fromMe || (sock.user && msg.key.participant === sock.user.id);
						if (isFromBot && upsert.type === "notify") {
							continue;
						}

						try {
							await getCommand(sock, msg, cache);
						} catch (msgError) {
							console.error("Error processing individual message:", msgError);
							console.error("Problematic message key:", msg.key);
						}
					}
				}
			}

			if (event["connection.update"]) {
				try {
					await getConnectionUpdate(startSock, event["connection.update"]);
				} catch (connError) {
					console.error("Error in connection update:", connError);
				}
			}

			if (event["group-participants.update"]) {
				try {
					await getGroupEvent(sock, event["group-participants.update"], cache);
				} catch (groupError) {
					console.error("Error in group event:", groupError);
				}
			}

			if (event["call"]) {
				try {
					await getCallEvent(sock, event["call"]);
				} catch (callError) {
					console.error("Error in call event:", callError);
				}
			}
		} catch (eventError) {
			console.error("Error processing event:", eventError);
			console.error("Event type:", Object.keys(event));
		}
	});
};

module.exports = events;
