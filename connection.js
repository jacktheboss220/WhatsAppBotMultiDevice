const NodeCache = require("node-cache");
const cache = new NodeCache();

const socket = require("./functions/getSocket");
const events = require("./functions/getEvents");

const startSock = async (connectionType) => {
    console.log("connection type in startSock", connectionType);
    const { sock, saveCreds } = await socket(connectionType);
    events(sock, startSock, saveCreds, cache);
    return sock;
};

module.exports = startSock;
