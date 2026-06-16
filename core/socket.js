import NodeCache from "node-cache";
import makeWASocket, { makeCacheableSignalKeyStore } from "baileys";
import { fetchLatestBaileysVersion } from "baileys";
import { useMongoDBAuthState } from "./auth.js";
import P from "pino";

const logger = P({ level: "silent" });

const messageCache = new NodeCache({
	stdTTL: 120, // Reduced to 2 minutes
	checkperiod: 30,
	maxKeys: 100, // Reduced from 200
	useClones: false,
});

let authStateCleanup = null;

const socket = async () => {
	const { version, isLatest } = await fetchLatestBaileysVersion();
	console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}\n`);

	// Cleanup previous auth state if exists (prevents memory leak on reconnect)
	if (authStateCleanup) {
		authStateCleanup();
		authStateCleanup = null;
	}

	// Use custom MongoDB auth state instead of file-based auth
	const { state, saveCreds, cleanup } = await useMongoDBAuthState();
	authStateCleanup = cleanup;

	console.log("✅ Using MongoDB auth state");
	if (state.creds?.me) {
		console.log(`✅ Authenticated as: ${state.creds.me.id}`);
	} else {
		console.log("⚠️ No existing credentials - QR scan required");
	}

	const socketStartTime = Date.now();

	const sock = makeWASocket({
		version,
		logger,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},

		generateHighQualityLinkPreview: true,

		getMessage,
		markOnlineOnConnect: true,
		syncFullHistory: false,
		shouldSyncHistoryMessage: () => false,

		connectTimeoutMs: 60000,
		defaultQueryTimeoutMs: 90000,
		keepAliveIntervalMs: 15000,

		browser: ["Ubuntu", "Chrome", "20.0.04"],
		emitOwnEvents: false, // IMPORTANT
		retryRequestDelayMs: 250,
		maxMsgRetryCount: 5,

		uploadTimeoutMs: 60000,

		// keep this minimal
		patchMessageBeforeSending: (msg) => msg,
	});

	async function getMessage(key) {
		try {
			const cacheKey = `${key.remoteJid}:${key.id}`;
			if (messageCache.has(cacheKey)) {
				return messageCache.get(cacheKey);
			}
			return undefined;
		} catch (error) {
			logger.error("Error in getMessage function:", error);
			return undefined;
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
	sock.ev.on("creds.update", async () => {
		try {
			await saveCreds();
			console.log("💾 Credentials saved to MongoDB");
		} catch (error) {
			console.error("Error updating credentials:", error);
		}
	});

	// Clear interval and cleanup on socket close
	sock.ws.on("close", () => {
		if (authStateCleanup) {
			authStateCleanup();
			authStateCleanup = null;
		}
		messageCache.flushAll();
		console.log("🧹 Socket cleanup completed");
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
			}
		}
	});

	// Add startup time to socket for other functions to use
	sock.startupTime = socketStartTime;

	return sock;
};

export default socket;
