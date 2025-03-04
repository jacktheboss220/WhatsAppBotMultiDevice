const NodeCache = require("node-cache");
const cache = new NodeCache();

const socket = require("./functions/getSocket");
const events = require("./functions/getEvents");

const startSock = async () => {
    const sock = await socket();
    events(sock, startSock, cache);
    return sock;
};

module.exports = startSock;
