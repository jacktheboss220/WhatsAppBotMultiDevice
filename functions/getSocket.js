const {
	default: makeWASocket,
	fetchLatestBaileysVersion,
	useMultiFileAuthState,
	makeInMemoryStore,
	makeCacheableSignalKeyStore,
	isJidBroadcast,
} = require("baileys");

const { startInterval } = require("./getInterval");

const { fetchAuth, updateLogin } = require("./getAuthDB");

const P = require("pino");
const logger = P({ level: "silent" });

const store = makeInMemoryStore({ logger });
store?.readFromFile("./baileys_store_multi.json");
startInterval(store);

const socket = async () => {
	const { version, isLatest } = await fetchLatestBaileysVersion();
	console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}\n`);
	const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");

	const creds = await fetchAuth(state);
	if (creds) {
		state.creds = creds;
	}

	const sock = makeWASocket({
		version,
		logger,
		printQRInTerminal: true,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		shouldSyncHistoryMessage: (msg) => false,
		generateHighQualityLinkPreview: true,
		shouldIgnoreJid: (jid) => isJidBroadcast(jid),
		// getMessage,
	});
	store?.bind(sock.ev);
	async function getMessage(key) {
		if (store) {
			const msg = await store.loadMessage(key.remoteJid, key.id);
			return msg?.message || undefined;
		}
		return proto.Message.fromObject({});
	}

	sock.ev.on("creds.update", async (creds) => {
		saveCreds(creds);
		updateLogin(state);
	});

	return sock;
};

module.exports = socket;
