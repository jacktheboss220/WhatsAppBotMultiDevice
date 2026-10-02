import NodeCache from "node-cache";
import makeWASocket, { makeCacheableSignalKeyStore } from "baileys";
import { fetchLatestBaileysVersion } from "baileys";
import { useMongoDBAuthState } from "./auth.js";
import P from "pino";
import groupMetaStore from "../cache/groupMetaStore.js";

const logger = P({ level: "silent" });

// Holds messages the BOT SENT so getMessage() can answer WhatsApp's retry requests
// (a recipient that couldn't decrypt a reply asks the sender to resend it).
const messageCache = new NodeCache({
	stdTTL: 600,
	checkperiod: 60,
	maxKeys: 500,
	useClones: false,
});

// Wraps sock.sendMessage so every sent message is remembered. This cache used to be filled with
// INCOMING messages instead, which getMessage() never needs, and it hit its size cap within minutes.
export const cacheOutgoing = (sock, cache) => {
	const send = sock.sendMessage.bind(sock);
	sock.sendMessage = async (...args) => {
		const sent = await send(...args);
		try {
			if (sent?.message && sent.key?.id) {
				cache.set(`${sent.key.remoteJid}:${sent.key.id}`, sent.message);
			}
		} catch {
			// cache full/unavailable must never fail a send
		}
		return sent;
	};
	return sock;
};

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
		cachedGroupMetadata: async (jid) => groupMetaStore.get(jid),
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

	cacheOutgoing(sock, messageCache);

	// Enhanced session cleanup on errors
	sock.ev.on("creds.update", async () => {
		try {
			await saveCreds();
			console.log("💾 Credentials saved to MongoDB");
		} catch (error) {
			console.error("Error updating credentials:", error);
		}
	});

	// Clear interval and cleanup on socket close — only clear the module-level
	// ref if it's still ours, else a late close event from a stale socket would
	// wipe out the flush timer/buffer of the socket that already replaced it.
	sock.ws.on("close", () => {
		if (authStateCleanup === cleanup) {
			authStateCleanup();
			authStateCleanup = null;
		} else {
			cleanup();
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
