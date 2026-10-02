import { getGroupData, createGroupData, group } from "../../db/groupData.js";
import { getMemberData, createMembersData, member } from "../../db/members.js";
import axios from "axios";
import fs from "fs";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv, extendedMessageOriginal, isOwner } = msgInfoObj;

	// eval = full server access (env secrets, DB). Real owner only, and off unless explicitly enabled.
	if (process.env.ENABLE_EVAL !== "true") {
		return sendMessageWTyping(from, { text: "❌ Disabled. Set ENABLE_EVAL=true to use it." }, { quoted: msg });
	}
	if (!isOwner) {
		return sendMessageWTyping(from, { text: "❌ Owner only." }, { quoted: msg });
	}

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
	cmd: ["test", "code"],
	desc: "Run a piece of code to test it.",
	usage: "test | code",
	handler,
});
