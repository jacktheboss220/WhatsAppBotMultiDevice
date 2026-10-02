import { isPrivileged } from "../../../utils/roles.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { groupAdmins, sendMessageWTyping, groupMetadata, botNumber, extendedMessageOriginal } = msgInfoObj;
	// return sendMessageWTyping(
	//     from,
	//     { text: "```❌ The admin commands are blocked for sometime to avoid ban on whatsapp!```" },
	//     { quoted: msg }
	// );

	if (!groupAdmins.includes(botNumber[0]) && !groupAdmins.includes(botNumber[1])) {
		return sendMessageWTyping(from, { text: `❌ I'm not admin here` }, { quoted: msg });
	}

	if (!extendedMessageOriginal) {
		return sendMessageWTyping(from, { text: `*Mention or tag member.*` }, { quoted: msg });
	}

	const taggedJid = extendedMessageOriginal.participant || extendedMessageOriginal.mentionedJid?.[0];
	if (!taggedJid) {
		return sendMessageWTyping(from, { text: `*Mention or tag member.*` }, { quoted: msg });
	}

	if (
		taggedJid === groupMetadata.owner ||
		botNumber.includes(taggedJid) ||
		groupAdmins.includes(taggedJid) ||
		(await isPrivileged(sock, taggedJid))
	) {
		return sendMessageWTyping(from, { text: `❌ *Can't remove Bot/Owner/Moderator/admin*` }, { quoted: msg });
	}

	try {
		await sock
			.groupParticipantsUpdate(from, [taggedJid], "remove")
			.then(() => {
				sendMessageWTyping(from, { text: `✅ *Removed*` }, { quoted: msg });
			})
			.catch((err) => {
				console.log(err);
			});
	} catch (err) {
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
		console.log(err);
	}
};

export default () => ({
	cmd: ["remove", "kick", "ban"],
	desc: "Remove a member from the group. Tag them or reply to their message.",
	usage: "remove @mention | reply",
	handler,
});
