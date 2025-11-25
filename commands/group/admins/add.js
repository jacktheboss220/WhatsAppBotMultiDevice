import { normalizeJID } from "../../../functions/lidUtils.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { evv, groupAdmins, sendMessageWTyping, botNumber } = msgInfoObj;

	if (!groupAdmins.includes(botNumber[0]) && !groupAdmins.includes(botNumber[1])) {
		return sendMessageWTyping(from, { text: "❎ Bot needs to be admin to add members." }, { quoted: msg });
	}
	if (!evv && !msg.message.extendedTextMessage && !args[0]) {
		return sendMessageWTyping(
			from,
			{ text: "❎ Provide a number or reply to a member's message." },
			{ quoted: msg }
		);
	}

	let participant = msg.message.extendedTextMessage
		? msg.message.extendedTextMessage.contextInfo.participant
		: evv.split(" ").join("");
	if (participant.startsWith("@")) {
		return sendMessageWTyping(
			from,
			{ text: "Don't tag or mentions, provide the number in text." },
			{ quoted: msg }
		);
	}

	// Use normalizeJID for LID/PN support
	participant = await normalizeJID(sock, participant);

	if (participant.startsWith("+")) {
		participant = participant.split("+")[1];
	}

	try {
		const res = await sock.groupParticipantsUpdate(from, [participant], "add");
		const status = res[0].status;
		const statusMessages = {
			400: "❎ Invalid number, include country code.",
			403: "❎ Number has privacy setting on adding to group.",
			408: "❎ Number has left the group recently.",
			409: "❎ Number is already in group.",
			500: "❎ Group is full.",
			200: "✅ Number added to group.",
		};
		const text = statusMessages[status] || "❎ An error has occurred. Try again later.";
		sendMessageWTyping(from, { text: text }, { quoted: msg });
	} catch (error) {
		sendMessageWTyping(from, { text: error.toString() }, { quoted: msg });
		console.error(error);
	}
};

export default () => ({
	cmd: ["add"],
	desc: "Add a member to group.",
	usage: "add number | reply",
	handler,
});
