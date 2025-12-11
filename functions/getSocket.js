import NodeCache from "node-cache";
import makeWASocket from "baileys";
import { fetchLatestBaileysVersion } from "baileys";
import { useMongoDBAuthState } from "./useMongoDBAuthState.js";
import P from "pino";

const logger = P({ level: "silent" }); // Set to "error" to allow essential logs but suppress debug spam

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

	// Use custom MongoDB auth state instead of file-based auth
	const { state, saveCreds } = await useMongoDBAuthState();

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
			keys: state.keys, // Use MongoDB keys directly without cache wrapper
		},
		msgRetryCounterCache,
		generateHighQualityLinkPreview: true,
		getMessage,
		markOnlineOnConnect: true,
		syncFullHistory: false, // Disabled for better performance
		shouldSyncHistoryMessage: () => false,
		shouldIgnoreJid: (jid) => false,
		connectTimeoutMs: 60000,
		defaultQueryTimeoutMs: 60000,
		keepAliveIntervalMs: 30000,
		browser: ["Ubuntu", "Chrome", "20.0.04"],
		emitOwnEvents: true,
		retryRequestDelayMs: 150, // Reduced for faster retries
		maxMsgRetryCount: 3, // Reduced retry attempts
		shouldIgnoreSignalKeyStore: false, // Changed to false to use our MongoDB store
		uploadTimeoutMs: 60000, // Increased for large media in groups
		fireInitQueries: false,
		// Optimizations for large groups
		patchMessageBeforeSending: (message) => {
			// Disable read receipts for group messages to reduce overhead
			if (message.key?.remoteJid?.endsWith("@g.us")) {
				return message;
			}
			return message;
		},
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
				"getMessage called for key:" +
					` ${key.id} in ${key.remoteJid} with fromMe: ${key.fromMe}` +
					" but message not found in cache"
			);

			// Return undefined instead of empty message to prevent sending empty messages
			// This is safer than returning an empty message object
			return undefined;
		} catch (error) {
			logger.error("Error in getMessage function:", error);
			// Return undefined on error instead of empty message
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

	// Periodic auth state stats logging (every 5 minutes)
	const statsInterval = setInterval(async () => {
		try {
			const { getAuthStateStats } = await import("./useMongoDBAuthState.js");
			const stats = await getAuthStateStats();
			console.log(`📊 Auth state: ${stats.total} documents in MongoDB`, stats.byType);
		} catch (error) {
			console.error("Error getting auth state stats:", error);
		}
	}, 5 * 60 * 1000); // Every 5 minutes

	// Clear interval on socket close
	sock.ws.on("close", () => {
		clearInterval(statsInterval);
	});

	// Handle LID mapping updates (new in Baileys 7.x)
	// This event fires when Baileys discovers LID↔PN mappings
	sock.ev.on("lid-mapping.update", async (update) => {
		console.log("📋 LID mapping update received:", update);

		try {
			if (!update || Object.keys(update).length === 0) return;

			console.log(`📋 LID mapping update: ${Object.keys(update).length} mappings received`);

			// Import member collection dynamically to avoid circular dependencies
			const { member } = await import("../mongo-DB/membersDataDb.js");
			const { extractPhoneNumber } = await import("./lidUtils.js");

			// Process each mapping
			for (const [key, value] of Object.entries(update)) {
				try {
					// The update object contains mappings in the format:
					// { "phoneNumber": "lid@lid" } or { "lid@lid": "phoneNumber" }
					let phoneNumber, lid;

					if (key.includes("@lid")) {
						// key is LID, value is PN
						lid = key;
						phoneNumber = value;
					} else {
						// key is PN, value is LID
						phoneNumber = key;
						lid = value;
					}

					// Normalize the phone number JID
					const pnJid = phoneNumber.includes("@") ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
					const cleanPN = extractPhoneNumber(pnJid);

					// Update database with the LID mapping
					const result = await member.updateOne(
						{ _id: pnJid },
						{
							$set: {
								lid: lid,
								phoneNumber: cleanPN,
							},
						},
						{ upsert: false } // Don't create new documents, only update existing
					);

					if (result.modifiedCount > 0) {
						console.log(`✅ Updated LID for ${cleanPN}: ${lid}`);
					}
				} catch (err) {
					console.error(`❌ Error processing LID mapping for ${key}:`, err.message);
				}
			}
		} catch (error) {
			console.error("❌ Error handling LID mapping update:", error);
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

	// Add startup time to socket for other functions to use
	sock.startupTime = socketStartTime;

	return sock;
};

export default socket;
