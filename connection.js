import NodeCache from "node-cache";

// Optimized cache with TTL and memory management
const cache = new NodeCache({
	stdTTL: 300, // 5 minutes default TTL (reduced from 10)
	checkperiod: 60, // Check every 1 minute
	useClones: false, // Avoid cloning for better memory usage
	maxKeys: 300, // Reduced cache size for memory efficiency
	deleteOnExpire: true,
});

let cacheMonitorInterval = null;

if (cacheMonitorInterval) {
	clearInterval(cacheMonitorInterval);
}

// Monitor cache memory usage
cacheMonitorInterval = setInterval(() => {
	const stats = cache.getStats();
	if (stats.keys > 250) {
		// When approaching limit
		cache.flushAll(); // Clear cache to prevent memory issues
		console.log("Cache cleared due to high memory usage");
	}
}, 180000); // Check every 3 minutes

// Cleanup sessions more frequently during session issues

import socket from "./functions/getSocket.js";
import events from "./functions/getEvents.js";

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
let lastConnectionTime = 0;
const MIN_CONNECTION_INTERVAL = 10000; // 10 seconds minimum between attempts

let _onNewSock = null;
export const onNewSock = (fn) => { _onNewSock = fn; };

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
			connectionAttempts = 0; // Reset after cleanup
			setTimeout(() => {
				connectionAttempts = 0;
			}, 60000); // 1 minute reset
			return null;
		}

		connectionAttempts++;
		lastConnectionTime = now;
		console.log(`🔄 Starting socket connection (attempt ${connectionAttempts}): ${reason}`);


		const sock = await socket();
		if (sock) {
			if (_onNewSock) _onNewSock(sock);

			events(sock, startSock, cache);
			connectionAttempts = 0; // Reset on successful connection
			console.log("✅ Socket connection established successfully");
		}
		return sock;
	} catch (error) {
		console.error("❌ Error starting socket:", error.message);
		return null;
	}
};

export default startSock;
