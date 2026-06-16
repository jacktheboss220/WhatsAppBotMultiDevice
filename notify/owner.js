import sendToTelegram from "./telegram.js";
import { getSock } from "../core/socketRef.js";

const ownerJid = process.env.MY_NUMBER?.split(",")[0] + "@s.whatsapp.net";

// Convert HTML tags to WhatsApp markdown + decode HTML entities
function htmlToWa(html) {
	return html
		.replace(/<b>(.*?)<\/b>/gi, "*$1*")
		.replace(/<code>(.*?)<\/code>/gi, "`$1`")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

const notifyOwner = (sock, mess, msg) => {
	sendToTelegram(mess);

	const activeSock = sock?.user ? sock : getSock();
	if (!activeSock?.user || !ownerJid) return;

	const waText = htmlToWa(mess);
	const sendOpts = msg ? { quoted: msg } : {};

	activeSock.sendMessage(ownerJid, { text: waText }, sendOpts).catch(() => {});
};

export default notifyOwner;
