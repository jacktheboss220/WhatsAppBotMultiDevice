const getConnectionUpdate = require("./getConnectionUpdateEvent");
const getCommand = require("./getMessagesEvent");
const getGroupEvent = require("./getGroupEvent");
const getCallEvent = require("./getCallEvents");

const events = async (sock, startSock, cache) => {
	sock.ev.process(async (event) => {
		if (event["messages.upsert"]) {
			const upsert = event["messages.upsert"];
			if (upsert.type === "notify") {
				for (const msg of upsert.messages) {
					if (!msg.message) continue;
					getCommand(sock, msg, cache);
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
	});
};

module.exports = events;
