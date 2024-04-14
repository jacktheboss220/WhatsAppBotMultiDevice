const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    makeInMemoryStore,
    makeCacheableSignalKeyStore,
    isJidBroadcast,
} = require("@adiwajshing/baileys");

const { startInterval } = require("./getInterval");

const { fetchAuth } = require("./getAuthDB");

const P = require("pino");
const logger = P({ level: "silent" });

const store = makeInMemoryStore({ logger });
store?.readFromFile("./baileys_store_multi.json");
startInterval(store);

const socket = async (connectionType) => {
    await fetchAuth(connectionType);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}\n`);
    const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
        shouldIgnoreJid: (jid) => isJidBroadcast(jid),
        getMessage,
    });
    store?.bind(sock.ev);
    async function getMessage(key) {
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id);
            return msg?.message || undefined;
        }
        return proto.Message.fromObject({});
    }
    return { sock, saveCreds };
};

module.exports = socket;
