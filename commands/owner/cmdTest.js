import { getGroupData, createGroupData, group } from "../../db/groupData.js";
import { getMemberData, createMembersData, member } from "../../db/members.js";
import axios from "axios";
import fs from "fs";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv, command, extendedMessageOriginal } = msgInfoObj;

	let taggedJid;
	if (extendedMessageOriginal) {
		taggedJid = extendedMessageOriginal.participant || extendedMessageOriginal.mentionedJid?.[0];
	}

	if (args.length === 0) {
		return sendMessageWTyping(from, { text: `❌ empty query!` }, { quoted: msg });
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
