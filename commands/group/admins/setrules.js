import { group } from "../../../db/groupData.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv } = msgInfoObj;

	if (args[0] === "reset") {
		await group.updateOne({ _id: from }, { $set: { rules: "" } });
		return sendMessageWTyping(from, { text: "Group rules cleared." }, { quoted: msg });
	}
	if (!evv?.trim()) {
		return sendMessageWTyping(
			from,
			{ text: "Write the rules after the command, for example:\n*setrules 1. No spam\n2. Be respectful*" },
			{ quoted: msg },
		);
	}
	await group.updateOne({ _id: from }, { $set: { rules: evv.trim() } });
	sendMessageWTyping(from, { text: "✅ Group rules saved. Members can see them with *rules*." }, { quoted: msg });
};

export default () => ({
	cmd: ["setrules"],
	desc: "Set the group rules shown by the rules command, or clear them.",
	usage: "setrules <rules text> | setrules reset",
	handler,
});
