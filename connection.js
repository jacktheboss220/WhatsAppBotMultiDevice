const NodeCache = require("node-cache");
const { performFullCleanup, emergencyCleanup } = require("./functions/systemCleanup");

// Optimized cache with TTL and memory management
const cache = new NodeCache({
	stdTTL: 600, // 10 minutes default TTL
	checkperiod: 120, // Check every 2 minutes
	useClones: false, // Avoid cloning for better memory usage
	maxKeys: 1000, // Limit cache size
	deleteOnExpire: true,
});

// Monitor cache memory usage
setInterval(() => {
	const stats = cache.getStats();
	if (stats.keys > 800) {
		// When approaching limit
		cache.flushAll(); // Clear cache to prevent memory issues
		console.log("Cache cleared due to high memory usage");
	}
}, 300000); // Check every 5 minutes

// Cleanup sessions more frequently during session issues
setInterval(() => {
	performFullCleanup();
}, 300000); // Every 5 minutes instead of 10

const socket = require("./functions/getSocket");
const events = require("./functions/getEvents");

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
let lastConnectionTime = 0;
const MIN_CONNECTION_INTERVAL = 10000; // 10 seconds minimum between attempts

const startSock = async (reason = "initial") => {
	try {
		const now = Date.now();

		// Prevent too frequent reconnection attempts
		if (now - lastConnectionTime < MIN_CONNECTION_INTERVAL) {
			console.log("⏳ Connection attempt too soon, waiting...");
			return null;
		}

		if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
			console.log("❌ Max connection attempts reached. Performing emergency cleanup and resetting...");
			await emergencyCleanup();
			connectionAttempts = 0; // Reset after cleanup
			// Wait longer before allowing reconnection
			setTimeout(() => {
				connectionAttempts = 0;
			}, 60000); // 1 minute reset
			return null;
		}

		connectionAttempts++;
		lastConnectionTime = now;
		console.log(`🔄 Starting socket connection (attempt ${connectionAttempts}): ${reason}`);

		// Perform comprehensive cleanup to prevent stale references
		await performFullCleanup();

		const sock = await socket();
		if (sock) {
			events(sock, startSock, cache);
			connectionAttempts = 0; // Reset on successful connection
			console.log("✅ Socket connection established successfully");
		}
		return sock;
	} catch (error) {
		console.error("❌ Error starting socket:", error.message);

		// Enhanced session error detection and handling
		if (
			error.message.includes("session") ||
			error.message.includes("prekey") ||
			error.message.includes("stale") ||
			error.message.includes("unauthorized")
		) {
			console.log("🧹 Session-related error detected, performing comprehensive cleanup...");
			await performFullCleanup();

			// Reset connection attempts for session issues
			connectionAttempts = Math.max(0, connectionAttempts - 1);
		}

		return null;
	}
};

module.exports = startSock;
