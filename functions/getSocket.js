import NodeCache from "node-cache";
import makeWASocket from "baileys";
import { fetchLatestBaileysVersion } from "baileys";
import { useMongoDBAuthState } from "./useMongoDBAuthState.js";
import P from "pino";

const logger = P({ level: "silent" }); // Set to "error" to allow essential logs but suppress debug spam

// Optimized caches with reduced memory footprint
const msgRetryCounterCache = new NodeCache({
	stdTTL: 180, // Reduced to 3 minutes
	checkperiod: 30,
	maxKeys: 200, // Reduced from 500
	useClones: false,
});

const messageCache = new NodeCache({
	stdTTL: 120, // Reduced to 2 minutes
	checkperiod: 30,
	maxKeys: 100, // Reduced from 200
	useClones: false,
});

// Store interval references at module level to prevent accumulation on reconnect
let cacheCleanupInterval = null;
let statsInterval = null;
let authStateCleanup = null;

// Clear previous intervals if they exist
if (cacheCleanupInterval) clearInterval(cacheCleanupInterval);

// Cleanup old cache entries periodically
cacheCleanupInterval = setInterval(() => {
	const msgStats = messageCache.getStats();
	const retryStats = msgRetryCounterCache.getStats();

	if (msgStats.keys > 80) {
		messageCache.flushAll();
		console.log("Message cache cleared");
	}

	if (retryStats.keys > 150) {
		msgRetryCounterCache.flushAll();
		console.log("Retry counter cache cleared");
	}
}, 120000); // Every 2 minutes

const socket = async () => {
	const { version, isLatest } = await fetchLatestBaileysVersion();
	console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}\n`);

	// Cleanup previous auth state if exists (prevents memory leak on reconnect)
	if (authStateCleanup) {
		authStateCleanup();
		authStateCleanup = null;
	}

	// Clear previous stats interval
	if (statsInterval) {
		clearInterval(statsInterval);
		statsInterval = null;
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
			keys: state.keys,
		},

		msgRetryCounterCache,
		generateHighQualityLinkPreview: true,

		getMessage,
		markOnlineOnConnect: true,
		syncFullHistory: false,
		shouldSyncHistoryMessage: () => false,

		connectTimeoutMs: 60000,
		defaultQueryTimeoutMs: 60000,
		keepAliveIntervalMs: 30000,

		browser: ["Ubuntu", "Chrome", "20.0.04"],
		emitOwnEvents: false, // IMPORTANT
		retryRequestDelayMs: 150,
		maxMsgRetryCount: 3,

		uploadTimeoutMs: 60000,
		fireInitQueries: false,

		// keep this minimal
		patchMessageBeforeSending: (msg) => msg,
	});

	async function getMessage(key) {
		try {
			const cacheKey = `${key.remoteJid}:${key.id}`;
			if (messageCache.has(cacheKey)) {
				logger.debug("Retrieved message from cache:", cacheKey);
				return messageCache.get(cacheKey);
			}

			if (msgRetryCounterCache.has(key.id)) {
				logger.debug("Retrieved message from retry cache:", key.id);
				return undefined;
			}

			logger.debug(
				"getMessage called for key:" +
					` ${key.id} in ${key.remoteJid} with fromMe: ${key.fromMe}` +
					" but message not found in cache"
			);

			return undefined;
		} catch (error) {
			logger.error("Error in getMessage function:", error);
			return undefined;
		}
	}

	// Cache incoming messages for getMessage function with size limit
	sock.ev.on("messages.upsert", (m) => {
		try {
			// Add startup delay to prevent processing old messages immediately after restart
			const timeSinceStart = Date.now() - socketStartTime;
			if (timeSinceStart < 5000) {
				// Wait 5 seconds after socket creation
				console.log("⏳ Skipping message during startup period");
				return;
			}

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

	// Periodic auth state stats logging (every 10 minutes - reduced frequency)
	statsInterval = setInterval(async () => {
		try {
			const { getAuthStateStats } = await import("./useMongoDBAuthState.js");
			const stats = await getAuthStateStats();
			console.log(`📊 Auth state: ${stats.total} documents in MongoDB`, stats.byType);
		} catch (error) {
			console.error("Error getting auth state stats:", error);
		}
	}, 10 * 60 * 1000); // Every 10 minutes (reduced from 5)

	// Clear interval and cleanup on socket close
	sock.ws.on("close", () => {
		if (statsInterval) {
			clearInterval(statsInterval);
			statsInterval = null;
		}
		if (authStateCleanup) {
			authStateCleanup();
			authStateCleanup = null;
		}
		// Clear caches on disconnect
		messageCache.flushAll();
		msgRetryCounterCache.flushAll();
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
				msgRetryCounterCache.flushAll();
			}
		}
	});

	// Add startup time to socket for other functions to use
	sock.startupTime = socketStartTime;

	return sock;
};

export default socket;
