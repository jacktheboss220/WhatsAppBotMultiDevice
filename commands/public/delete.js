const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { botNumberJid, sendMessageWTyping, groupAdmins, senderJid } = msgInfoObj;

	try {
		// Check if the message is a reply
		if (!msg.message.extendedTextMessage) {
			return sendMessageWTyping(from, { text: `❎ Tag a message to delete.` }, { quoted: msg });
		}

		// Check if the sender is authorized to delete messages
		const senderIsAdmin = groupAdmins.includes(senderJid);
		const botIsAdmin = groupAdmins.includes(botNumberJid);
		const isBotMessage = msg.message.extendedTextMessage.contextInfo.participant === botNumberJid;

		if (!isBotMessage) {
			if (!senderIsAdmin) {
				return sendMessageWTyping(
					from,
					{ text: `❎ Only admins can delete others' messages.` },
					{ quoted: msg }
				);
			}

			if (!botIsAdmin) {
				return sendMessageWTyping(
					from,
					{ text: `❎ Bot needs to be admin to delete others' messages.` },
					{ quoted: msg }
				);
			}
		}

		// Prepare options for deleting the message
		const options = {
			remoteJid: from,
			fromMe: false,
			id: msg.message.extendedTextMessage.contextInfo.stanzaId,
			participant: msg.message.extendedTextMessage.contextInfo.participant,
		};

		// If the message is from the bot, delete its own message
		if (isBotMessage) {
			options.remoteJid = botNumberJid;
			options.fromMe = true;
		}

		// Send the delete message request
		await sock.sendMessage(from, { delete: options });
	} catch (err) {
		console.error("Error deleting message:", err);
		sendMessageWTyping(from, { text: `❎ Error deleting message: ${err.toString()}` }, { quoted: msg });
	}
};

module.exports.command = () => ({
	cmd: ["delete", "d", "dd"],
	desc: "Delete a message",
	usage: "delete <reply to message>",
	handler,
});
