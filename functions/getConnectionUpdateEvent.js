const { stopInterval } = require("./getInterval");
const { DisconnectReason } = require("baileys");

const getConnectionUpdate = async (startSock, events) => {
    const update = events;
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
        console.error(lastDisconnect.error.output.statusCode, DisconnectReason.loggedOut);
        if (lastDisconnect.error.output.statusCode == DisconnectReason.loggedOut) {
            stopInterval();
        }
        startSock();
    }
    console.log("connection update", update);
}

module.exports = getConnectionUpdate;