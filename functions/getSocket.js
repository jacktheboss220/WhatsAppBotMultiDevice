const NodeCache = require("node-cache");

const {
	default: makeWASocket,
	fetchLatestBaileysVersion,
	useMultiFileAuthState,
	makeCacheableSignalKeyStore,
	proto,
} = require("baileys");

const { fetchAuth, updateLogin } = require("./getAuthDB");

const P = require("pino");
const logger = P({ level: "silent" });

// Optimized caches with memory management
const msgRetryCounterCache = new NodeCache({
	stdTTL: 300, // 5 minutes
	checkperiod: 60,
	maxKeys: 500,
	useClones: false,
});

const messageCache = new NodeCache({
	stdTTL: 180, // Reduced to 3 minutes for better memory management
	checkperiod: 30,
	maxKeys: 200, // Limit message cache size
	useClones: false,
});

// Cleanup old cache entries periodically
setInterval(() => {
	const msgStats = messageCache.getStats();
	const retryStats = msgRetryCounterCache.getStats();

	if (msgStats.keys > 150) {
		messageCache.flushAll();
		console.log("Message cache cleared");
	}

	if (retryStats.keys > 400) {
		msgRetryCounterCache.flushAll();
		console.log("Retry counter cache cleared");
	}
}, 120000); // Every 2 minutes

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
		// Improved session management options
		markOnlineOnConnect: true,
		syncFullHistory: false,
		shouldSyncHistoryMessage: () => false,
		shouldIgnoreJid: (jid) => false,
		// Better connection management to reduce session conflicts
		connectTimeoutMs: 60000,
		defaultQueryTimeoutMs: 60000,
		keepAliveIntervalMs: 30000,
		// Browser configuration to reduce detection
		browser: ["Ubuntu", "Chrome", "20.0.04"],
		// Reduce session conflicts by limiting retries
		emitOwnEvents: false,
		// Additional options to handle session issues
		retryRequestDelayMs: 250,
		maxMsgRetryCount: 5,
		// Handle pre-key issues better
		shouldIgnoreSignalKeyStore: false,
		// Better handling of message sending failures
		uploadTimeoutMs: 30000,
	});

	async function getMessage(key) {
		try {
			// Try to get message from message cache first
			const cacheKey = `${key.remoteJid}:${key.id}`;
			if (messageCache.has(cacheKey)) {
				logger.debug("Retrieved message from cache:", cacheKey);
				return messageCache.get(cacheKey);
			}

			// Try to get from retry counter cache
			if (msgRetryCounterCache.has(key.id)) {
				logger.debug("Retrieved message from retry cache:", key.id);
				return msgRetryCounterCache.get(key.id);
			}

			// Log the failed getMessage attempt with more context
			logger.debug(
				"getMessage called for key:",
				{
					remoteJid: key.remoteJid,
					id: key.id,
					fromMe: key.fromMe,
					participant: key.participant,
				},
				"but message not found in cache"
			);

			// Return a more complete empty message object to prevent session issues
			return proto.Message.fromObject({
				conversation: "",
				messageContextInfo: {
					deviceListMetadata: {},
					deviceListMetadataVersion: 2,
				},
			});
		} catch (error) {
			logger.error("Error in getMessage function:", error);
			// Return basic empty message on error
			return proto.Message.fromObject({});
		}
	}

	// Cache incoming messages for getMessage function with size limit
	sock.ev.on("messages.upsert", (m) => {
		try {
			for (const msg of m.messages) {
				if (msg.message) {
					const cacheKey = `${msg.key.remoteJid}:${msg.key.id}`;
					// Only cache if under limit to prevent memory overflow
					if (messageCache.getStats().keys < 180) {
						messageCache.set(cacheKey, msg.message);
					}
				}
			}
		} catch (error) {
			logger.error("Error caching message:", error);
		}
	});

	// Enhanced session cleanup on errors
	sock.ev.on("creds.update", async (creds) => {
		try {
			saveCreds(creds);
			updateLogin(state);
		} catch (error) {
			console.error("Error updating credentials:", error);
		}
	});

	// Handle connection errors gracefully
	sock.ev.on("connection.update", (update) => {
		if (update.lastDisconnect?.error) {
			const error = update.lastDisconnect.error;
			console.log("Connection error details:", error.message);

			// Clear caches on connection issues
			if (error.message.includes("session") || error.message.includes("prekey")) {
				console.log("Clearing message caches due to session issues...");
				messageCache.flushAll();
				msgRetryCounterCache.flushAll();
			}
		}
	});

	return sock;
};

module.exports = socket;
