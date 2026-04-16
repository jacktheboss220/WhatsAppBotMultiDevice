import { DisconnectReason } from "baileys";
import sendToTelegram from "./telegramLogger.js";

const getConnectionUpdate = async (startSock, events) => {
	const update = events;
	const { connection, lastDisconnect, qr } = update;

	console.log("Connection update:", connection);

	if (connection === "close") {
		const error = lastDisconnect?.error;
		const statusCode = error?.output?.statusCode;
		const errorMessage = error?.message || "";

		console.log("Connection closed. Reason:", statusCode);
		console.log("Error details:", errorMessage);

		// "conflict" means another session replaced this one — always reconnect
		const isConflict = errorMessage.toLowerCase().includes("conflict");
		// True logout = 401 with NO conflict (user explicitly logged out from phone)
		const isTrueLogout = statusCode === DisconnectReason.loggedOut && !isConflict;

		if (isTrueLogout) {
			console.log("❌ Device logged out, manual re-authentication required");
			sendToTelegram(
				`🚨 <b>Bot Logged Out</b>\n` +
				`━━━━━━━━━━━━━━\n` +
				`⚠️ Device was logged out from WhatsApp.\n` +
				`🔑 Manual re-authentication required.`
			);
		} else {
			const reason = isConflict
				? "Session conflict (another device connected)"
				: `Status ${statusCode}`;

			console.log(`🔄 Reconnecting... Reason: ${reason}`);
			sendToTelegram(
				`🔄 <b>Bot Disconnected</b>\n` +
				`━━━━━━━━━━━━━━\n` +
				`📋 <b>Reason:</b> ${reason}\n` +
				`⏳ Reconnecting in 5 seconds...`
			);
			setTimeout(() => {
				startSock("reconnect");
			}, 5000);
		}
	} else if (connection === "connecting") {
		console.log("🔗 Connecting to WhatsApp...");
	} else if (connection === "open") {
		console.log("✅ Successfully connected to WhatsApp!");
		console.log("📱 Ready to receive and process messages");
		sendToTelegram(
			`✅ <b>Bot Connected</b>\n` +
			`━━━━━━━━━━━━━━\n` +
			`📱 Successfully connected to WhatsApp.`
		);
	}

	if (qr) {
		console.log("📱 QR Code received for scanning");
	}
};

export default getConnectionUpdate;
