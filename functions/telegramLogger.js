import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const escapeHtml = (text) =>
	String(text ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

/**
 * Send a log message to Telegram.
 * Falls back to console.warn if env vars are not configured.
 * @param {string} text - HTML-formatted text
 */
const sendToTelegram = async (text) => {
	if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
		console.warn("[TelegramLogger] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Skipping.");
		return;
	}
	try {
		await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
			chat_id: TELEGRAM_CHAT_ID,
			text: text,
			parse_mode: "HTML",
		});
	} catch (err) {
		console.error("[TelegramLogger] Failed to send message:", err.message);
	}
};

export default sendToTelegram;
