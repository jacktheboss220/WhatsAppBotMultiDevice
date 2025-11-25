import { extractPhoneNumber } from "../../../functions/lidUtils.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, botNumber } = msgInfoObj;
	const groupMetadata = await sock.groupMetadata(from);
	let message = "";

	try {
		if (msg.message.extendedTextMessage) {
			console.log(msg.message.extendedTextMessage.quotedMessage);
			message = msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
		}
		if (args.length > 0) {
			message = args.join(" ");
		}
		const mention = groupMetadata.participants.filter((p) => p.id != botNumber[0] && p.id != botNumber[1]);
		const random = Math.floor(Math.random() * mention.length);
		// Use extractPhoneNumber for LID/PN compatibility
		console.log(message, mention[random].id, extractPhoneNumber(mention[random].id));
		message += " @" + extractPhoneNumber(mention[random].id);
		if (!args[0]) sock.sendMessage(from, { text: message, mentions: [mention[random].id] }, { quoted: msg });
		else sock.sendMessage(from, { text: message, mentions: [mention[random].id] });
	} catch (err) {
		console.error(err);
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["rn", "rt"],
	desc: "Random Tag a member",
	usage: "rn | rt ",
	handler,
});
