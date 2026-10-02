import { getGroupData } from "../../../db/groupData.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	const data = await getGroupData(from);
	const text = data?.rules
		? `📜 *Group Rules*\n\n${data.rules}`
		: "No rules set for this group yet. Admins can set them with *setrules <text>*.";
	sendMessageWTyping(from, { text }, { quoted: msg });
};

export default () => ({
	cmd: ["rules"],
	desc: "Show the rules of this group.",
	usage: "rules",
	handler,
});
