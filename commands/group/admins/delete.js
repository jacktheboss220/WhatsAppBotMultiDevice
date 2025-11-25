import { extractPhoneNumber } from "../../../functions/lidUtils.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { botNumber, sendMessageWTyping, groupAdmins } = msgInfoObj;

	try {
		if (!msg.message.extendedTextMessage) {
			return sendMessageWTyping(from, { text: `❎ Reply on a message to delete.` }, { quoted: msg });
		}

		const participant = msg.message.extendedTextMessage.contextInfo.participant;
		// Use extractPhoneNumber for LID/PN compatibility
		if (
			!(
				extractPhoneNumber(participant) == extractPhoneNumber(botNumber[0]) ||
				extractPhoneNumber(participant) == extractPhoneNumber(botNumber[1])
			)
		) {
			if (!!groupAdmins.includes(botNumber[0]) && !groupAdmins.includes(botNumber[1]))
				return sendMessageWTyping(
					from,
					{ text: `❎ Bot need to be admin in order to delete messages.` },
					{ quoted: msg }
				);
		}

		let options = {
			remoteJid: from,
			fromMe: false,
			id: msg.message.extendedTextMessage.contextInfo.stanzaId,
			participant: msg.message.extendedTextMessage.contextInfo.participant,
		};

		if (
			extractPhoneNumber(participant) == extractPhoneNumber(botNumber[0]) ||
			extractPhoneNumber(participant) == extractPhoneNumber(botNumber[1])
		) {
			options.remoteJid = botNumber[0];
			options.fromMe = true;
		}

		sock.sendMessage(from, { delete: options });
	} catch (err) {
		console.log(err);
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["delete"],
	desc: "Delete a message",
	usage: "delete | reply to message to delete",
	handler,
});
