const NodeCache = require("node-cache");

const {
	default: makeWASocket,
	fetchLatestBaileysVersion,
	useMultiFileAuthState,
	makeCacheableSignalKeyStore,
} = require("baileys");

const { fetchAuth, updateLogin } = require("./getAuthDB");

const P = require("pino");
const logger = P({ level: "silent" });

const msgRetryCounterCache = new NodeCache();

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
		msgRetryCounterCache,
		generateHighQualityLinkPreview: true,
		getMessage,
	});

	async function getMessage(key) {
		return proto.Message.fromObject({});
	}

	sock.ev.on("creds.update", async (creds) => {
		saveCreds(creds);
		updateLogin(state);
	});

	return sock;
};

module.exports = socket;
