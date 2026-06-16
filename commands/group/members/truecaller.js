import dotenv from "dotenv";
dotenv.config();
const TRUECALLER_ID = process.env.TRUECALLER_ID || "";
import truecallerjs from "truecallerjs";
import { extractPhoneNumber } from "../../../utils/lid.js";
import { escapeHtml } from "../../../notify/telegram.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { evv, sendMessageWTyping, notifyOwner, extendedMessageOriginal } = msgInfoObj;

	if (!TRUECALLER_ID) return sendMessageWTyping(from, { text: "```Truecaller ID is Missing```" }, { quoted: msg });

	let number;
	if (extendedMessageOriginal?.participant?.length > 0) {
		// Use extractPhoneNumber for LID/PN compatibility
		number = extractPhoneNumber(extendedMessageOriginal.participant);
	} else if (extendedMessageOriginal?.mentionedJid?.length > 0) {
		number = extractPhoneNumber(extendedMessageOriginal.mentionedJid[0]);
	} else {
		if (!args[0]) return sendMessageWTyping(from, { text: `❌ Give number or tag on message` }, { quoted: msg });
		number = evv.replace(/\s*/g, "");
	}
	console.log(number);
	if (number.startsWith("+")) {
		number = number.split("+")[1];
	}
	if (!number.startsWith("91")) {
		return sendMessageWTyping(from, { text: `❌ Number must be start with 91` }, { quoted: msg });
	}

	var searchData = {
		number: number,
		countryCode: "IN",
		installationId: TRUECALLER_ID,
	};

	const response = await truecallerjs.search(searchData);
	if (!response) return sendMessageWTyping(from, { text: `❌ Number not found` }, { quoted: msg });
	const data = response.json().data[0];

	const name = response.getName();
	const { e164Format, numberType, countryCode, carrier, type } = data?.phones[0];
	const { city } = response.getAddresses()[0];
	const email = response.getEmailId();

	const message = `🔍 *Truecaller Result*\n\n👤 *Name:* ${name}\n📱 *Number:* ${e164Format}\n🏙️ *City:* ${city || "N/A"}\n🌍 *Country:* ${countryCode}\n📡 *Carrier:* ${carrier} _(${numberType})_\n📧 *Email:* ${email || "N/A"}`;
	const telegramMessage =
		`🔍 <b>Truecaller Result</b>\n` +
		`━━━━━━━━━━━━━━\n` +
		`👤 <b>Name:</b> ${escapeHtml(name)}\n` +
		`📱 <b>Number:</b> <code>${escapeHtml(e164Format)}</code>\n` +
		`🏙️ <b>City:</b> ${escapeHtml(city || "N/A")}\n` +
		`🌍 <b>Country:</b> ${escapeHtml(countryCode)}\n` +
		`📡 <b>Carrier:</b> ${escapeHtml(carrier)} (${escapeHtml(numberType)})\n` +
		`📧 <b>Email:</b> ${escapeHtml(email || "N/A")}`;

	notifyOwner(sock, telegramMessage, msg);
	sendMessageWTyping(from, { text: message }, { quoted: msg });
};

export default () => ({
	cmd: ["true", "truecaller"],
	desc: "Get Truecaller details of a number",
	usage: "true | reply to a message to get Truecaller details of that number",
	handler,
});
