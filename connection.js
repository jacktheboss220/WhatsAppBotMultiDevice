import NodeCache from "node-cache";

// Optimized cache with TTL and memory management
const cache = new NodeCache({
	stdTTL: 300, // 5 minutes default TTL (reduced from 10)
	checkperiod: 60, // Check every 1 minute
	useClones: false, // Avoid cloning for better memory usage
	maxKeys: 300, // Reduced cache size for memory efficiency
	deleteOnExpire: true,
});

import socket from "./core/socket.js";
import events from "./core/events.js";
import { setSock } from "./core/socketRef.js";

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
let lastConnectionTime = 0;
const MIN_CONNECTION_INTERVAL = 10000; // 10 seconds minimum between attempts

// ── Hook called every time a new socket is created (initial + every reconnect) ─
// index.js registers this so it can always track the live sock reference.
let _onNewSock = null;
export const onNewSock = (fn) => { _onNewSock = fn; };

const startSock = async (reason = "initial") => {
	let socketCreated = false; // retry only if we failed BEFORE a socket existed (else we would start a second one)
	try {
		const now = Date.now();

		// Prevent too frequent reconnection attempts — reschedule instead of dropping,
		// else a fast double-close (e.g. stream error right after a prior reconnect)
		// silently kills reconnection forever.
		if (now - lastConnectionTime < MIN_CONNECTION_INTERVAL) {
			const wait = MIN_CONNECTION_INTERVAL - (now - lastConnectionTime);
			console.log(`⏳ Connection attempt too soon, retrying in ${wait}ms...`);
			setTimeout(() => startSock(reason), wait);
			return null;
		}

		if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
			console.log("❌ Max connection attempts reached. Backing off for 1 minute, then trying again...");
			// Was: reset the counter and give up, so nothing ever called startSock again and the bot stayed offline.
			setTimeout(() => {
				connectionAttempts = 0;
				startSock(reason);
			}, 60000);
			return null;
		}

		connectionAttempts++;
		lastConnectionTime = now;
		console.log(`🔄 Starting socket connection (attempt ${connectionAttempts}): ${reason}`);

		// Perform comprehensive cleanup to prevent stale references

		const sock = await socket();
		socketCreated = !!sock;
		if (sock) {
			setSock(sock); // Update live reference for BullMQ worker
			// Notify index.js FIRST so it can attach its listener before events() runs
			if (_onNewSock) _onNewSock(sock);

			events(sock, startSock, cache);
			connectionAttempts = 0; // Reset on successful connection
			console.log("✅ Socket connection established successfully");
		}
		return sock;
	} catch (error) {
		console.error("❌ Error starting socket:", error.message);
		// socket() can throw (Mongo blip while reading auth, ...). With no live socket there is no 'close'
		// event to trigger a reconnect, so the bot used to stay offline until someone restarted it.
		if (!socketCreated) setTimeout(() => startSock(reason), 10000);
		return null;
	}
};

export default startSock;
