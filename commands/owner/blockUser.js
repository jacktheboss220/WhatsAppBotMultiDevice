import dotenv from "dotenv";
dotenv.config();
const myNumber = [
	process.env.MY_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.MY_NUMBER.split(",")[1] + "@lid",
];
import { member } from "../../db/members.js";
import { extractPhoneNumber, normalizeJID } from "../../utils/lid.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { command, botNumber, sendMessageWTyping, extendedMessageOriginal } = msgInfoObj;

	if (!extendedMessageOriginal)
		return sendMessageWTyping(from, { text: "❌ Tag / mentioned!" }, { quoted: msg });

	let taggedJid;

	taggedJid = extendedMessageOriginal.participant || extendedMessageOriginal.mentionedJid?.[0];

	const targetNumber = extractPhoneNumber(taggedJid);

	console.log(taggedJid, botNumber[0], botNumber[1]);

	if (
		targetNumber == extractPhoneNumber(botNumber[0]) ||
		targetNumber == extractPhoneNumber(botNumber[1]) ||
		myNumber.map((m) => extractPhoneNumber(m)).includes(targetNumber)
	)
		return sendMessageWTyping(from, { text: `_Command Can't be used on Bot / Mod / Owner_.💀` }, { quoted: msg });

	if (command == "block") {
		const dbJid = targetNumber + "@lid";
		member.updateOne({ _id: dbJid }, { $set: { isBlock: true } }).then(() => {
			sendMessageWTyping(from, { text: `❌ Blocked` }, { quoted: msg });
		});
	}

	if (command == "unblock") {
		const dbJid = targetNumber + "@lid";
		member.updateOne({ _id: dbJid }, { $set: { isBlock: false } }).then(() => {
			sendMessageWTyping(from, { text: `✅ *Unblocked*` }, { quoted: msg });
		});
	}
};

export default () => ({
	cmd: ["block", "unblock"],
	desc: "Block / Unblock a user",
	usage: "block | unblock | tag / mention the user | reply to a message to block / unblock",
	handler,
});
