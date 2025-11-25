import { DisconnectReason } from "baileys";

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

		if (shouldReconnect) {
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

export default getConnectionUpdate;
