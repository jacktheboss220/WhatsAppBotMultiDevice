import { group } from "../../../db/groupData.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	if (!args[0]) {
		const grpData = await group.findOne({ _id: from }, { projection: { isRankNotifOn: 1 } });
		const state = grpData?.isRankNotifOn ? "ON ✅" : "OFF ❌";
		return sendMessageWTyping(
			from,
			{ text: `🏅 Rank-up notifications: *${state}*\n\nUse \`ranknotif on/off\` to toggle.` },
			{ quoted: msg },
		);
	}

	const val = args[0].toLowerCase();
	if (val !== "on" && val !== "off") {
		return sendMessageWTyping(from, { text: "❌ Usage: `ranknotif on/off`" }, { quoted: msg });
	}

	await group.updateOne({ _id: from }, { $set: { isRankNotifOn: val === "on" } });
	return sendMessageWTyping(
		from,
		{
			text:
				val === "on"
					? "✅ Rank-up notifications *enabled*. Members will be notified when they reach a new rank."
					: "❌ Rank-up notifications *disabled*.",
		},
		{ quoted: msg },
	);
};

export default () => ({
	cmd: ["ranknotif", "rkn"],
	desc: "Toggle rank-up notifications for this group.",
	usage: "ranknotif on/off",
	handler,
});
