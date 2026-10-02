import dotenv from "dotenv";
dotenv.config();
const myNumber = [
	process.env.MY_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.MY_NUMBER.split(",")[1] + "@lid",
];
import { member } from "../../db/members.js";
import { extractPhoneNumber } from "../../utils/lid.js";
import { isPrivileged } from "../../utils/roles.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { command, botNumber, sendMessageWTyping, extendedMessageOriginal } = msgInfoObj;

	if (!extendedMessageOriginal)
		return sendMessageWTyping(from, { text: "❌ Tag / mentioned!" }, { quoted: msg });

	let taggedJid;

	taggedJid = extendedMessageOriginal.participant || extendedMessageOriginal.mentionedJid?.[0];
	if (!taggedJid) return sendMessageWTyping(from, { text: "❌ Tag / mentioned!" }, { quoted: msg });

	const targetNumber = extractPhoneNumber(taggedJid);

	console.log(taggedJid, botNumber[0], botNumber[1]);

	if (
		targetNumber == extractPhoneNumber(botNumber[0]) ||
		targetNumber == extractPhoneNumber(botNumber[1]) ||
		myNumber.map((m) => extractPhoneNumber(m)).includes(targetNumber) ||
		(await isPrivileged(sock, taggedJid))
	)
		return sendMessageWTyping(from, { text: `_Command Can't be used on Bot / Mod / Owner_.💀` }, { quoted: msg });

	if (command == "block") {
		member.updateOne({ _id: taggedJid }, { $set: { isBlock: true } }).then(() => {
			sendMessageWTyping(from, { text: `❌ Blocked` }, { quoted: msg });
		});
	}

	if (command == "unblock") {
		member.updateOne({ _id: taggedJid }, { $set: { isBlock: false } }).then(() => {
			sendMessageWTyping(from, { text: `✅ *Unblocked*` }, { quoted: msg });
		});
	}
};

export default () => ({
	cmd: ["block", "unblock"],
	desc: "Block or unblock a user from using the bot. Tag them or reply.",
	usage: "block | unblock | tag / mention the user | reply to a message to block / unblock",
	handler,
});
