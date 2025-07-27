const { DisconnectReason } = require("baileys");
const { cleanupStaleSessions } = require("./systemCleanup");

const getConnectionUpdate = async (startSock, events) => {
	const update = events;
	const { connection, lastDisconnect, qr } = update;

	console.log("Connection update:", connection);

	if (connection === "close") {
		const error = lastDisconnect?.error;
		const statusCode = error?.output?.statusCode;

		console.log("Connection closed. Reason:", statusCode);
		console.log("Error details:", error?.message || "Unknown error");

		const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

		// Check if it's a session-related error
		if (
			error?.message?.includes("session") ||
			error?.message?.includes("prekey") ||
			error?.message?.includes("stale") ||
			statusCode === DisconnectReason.badSession
		) {
			console.log("🧹 Session-related disconnection detected, cleaning up...");
			cleanupStaleSessions();

			setTimeout(() => {
				console.log("🔄 Reconnecting after session cleanup...");
				startSock("session-cleanup");
			}, 10000); // 10 seconds delay
		} else if (shouldReconnect) {
			console.log("🔄 Attempting to reconnect...");
			setTimeout(() => {
				startSock("reconnect");
			}, 5000);
		} else {
			console.log("❌ Device logged out, manual re-authentication required");
		}
	} else if (connection === "connecting") {
		console.log("🔗 Connecting to WhatsApp...");
	} else if (connection === "open") {
		console.log("✅ Successfully connected to WhatsApp!");
		console.log("📱 Ready to receive and process messages");
	}

	if (qr) {
		console.log("📱 QR Code received for scanning");
	}
};

module.exports = getConnectionUpdate;
