import { getGroupData, createGroupData, group } from "../../mongo-DB/groupDataDb.js";
import { getMemberData, createMembersData, member } from "../../mongo-DB/membersDataDb.js";
import axios from "axios";
import fs from "fs";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv, command } = msgInfoObj;

	if (command === "mano" && args.length > 0) {
		sock.groupParticipantsUpdate("19016677357-1630334490@g.us", ["91" + args[0] + "@s.whatsapp.net"], "add")
			.then((res) => {
				sendMessageWTyping(from, { text: JSON.stringify(res, null, 2) }, { quoted: msg });
			})
			.catch((err) => {
				sendMessageWTyping(from, { text: JSON.stringify(err, null, 2) }, { quoted: msg });
			});
	}

	let taggedJid;
	if (msg.message.extendedTextMessage) {
		taggedJid = msg.message.extendedTextMessage
			? msg.message.extendedTextMessage.contextInfo.participant
			: msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
	}

	if (args.length === 0) {
		return sendMessageWTyping(from, { text: `❎ empty query!` }, { quoted: msg });
	}
	try {
		let resultTest = eval(evv);
		if (typeof resultTest === "object")
			sendMessageWTyping(from, { text: JSON.stringify(resultTest) }, { quoted: msg });
		else sendMessageWTyping(from, { text: resultTest.toString() }, { quoted: msg });
	} catch (err) {
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["test", "code", "mano"],
	desc: "Test your code",
	usage: "test | code",
	handler,
});
