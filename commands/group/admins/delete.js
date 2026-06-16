import { extractPhoneNumber } from "../../../utils/lid.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { botNumber, sendMessageWTyping, groupAdmins, extendedMessageOriginal } = msgInfoObj;

	try {
		if (!extendedMessageOriginal) {
			return sendMessageWTyping(from, { text: `❌ Reply on a message to delete.` }, { quoted: msg });
		}

		const participant = extendedMessageOriginal.participant;
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
					{ text: `❌ Bot need to be admin in order to delete messages.` },
					{ quoted: msg }
				);
		}

		let options = {
			remoteJid: from,
			fromMe: false,
			id: extendedMessageOriginal.stanzaId,
			participant: extendedMessageOriginal.participant,
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
