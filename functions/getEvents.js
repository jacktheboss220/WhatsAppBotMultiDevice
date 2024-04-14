const getConnectionUpdate = require("./getConnectionUpdateEvent");
const getMessages = require("./getMessagesEvent");
const getGroupEvent = require("./getGroupEvent");

const events = async (sock, startSock, saveCreds, cache) => {
    sock.ev.process(async (events) => {
        if (events["messages.upsert"]) {
            const upsert = events["messages.upsert"];
            for (const msg of upsert.messages) {
                if (!msg.message) return;
                await getMessages(sock, msg, cache);
            }
        }
        if (events["connection.update"]) {
            await getConnectionUpdate(startSock, events["connection.update"]);
        }
        if (events["group-participants.update"]) {
            await getGroupEvent(sock, events["group-participants.update"], cache);
        }
        if (events["creds.update"]) {
            await saveCreds();
        }
    });
};

module.exports = events;