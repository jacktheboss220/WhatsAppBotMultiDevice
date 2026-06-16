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

// Tagged template: HTML structure stays literal; interpolated values auto-escape.
// Usage: sendToTelegram(html`<b>${userName}</b> ran <code>${cmd}</code>`)
export const html = (strings, ...values) =>
	strings.reduce((out, str, i) => out + str + (i < values.length ? escapeHtml(String(values[i] ?? "")) : ""), "");

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
		const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
		console.error("[TelegramLogger] Failed to send message:", detail);
	}
};

export default sendToTelegram;
