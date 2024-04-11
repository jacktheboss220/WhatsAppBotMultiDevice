const fs = require("fs");
const { readdir } = require("fs/promises");
const { stopInterval } = require("./getInterval");
const { DisconnectReason } = require("@adiwajshing/baileys");

const getConnectionUpdate = async (startSock, events) => {
    const update = events;
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
        console.log(lastDisconnect.error.output.statusCode, DisconnectReason.loggedOut);

        if (lastDisconnect.error.output.statusCode == DisconnectReason.loggedOut) {
            try {
                let path = "./baileys_auth_info/";
                let filenames = await readdir(path);
                filenames.forEach((file) => {
                    fs.unlinkSync(path + file);
                });
            } catch { }
            stopInterval();
            // reconnect if not logged out
            startSock("logout");
        } else if (lastDisconnect.error.output.statusCode == 515) {
            startSock("reconnecting");
        } else if (lastDisconnect.error.output.statusCode == 403) {
            startSock("error");
        } else {
            startSock();
        }
    }
    console.log("connection update", update);
}

module.exports = getConnectionUpdate;