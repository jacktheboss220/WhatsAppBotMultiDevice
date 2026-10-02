import { getGroupData, group } from "../../db/groupData.js";

const FEATURES = {
	bot: ["isBotOn", "Bot replies in this group"],
	eva: ["isChatBotOn", "Eva AI chat"],
	img: ["isImgOn", "Image search"],
	autosticker: ["isAutoStickerOn", "Auto sticker from images"],
	ranknotif: ["isRankNotifOn", "Rank-up notifications"],
	only91: ["is91Only", "Only +91 numbers can join"],
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, isGroup } = msgInfoObj;
	if (!isGroup) return sendMessageWTyping(from, { text: "Use In Group Only!" }, { quoted: msg });

	const data = await getGroupData(from);
	if (!data) return sendMessageWTyping(from, { text: "No data found in DB for this group" }, { quoted: msg });

	const feature = FEATURES[args[0]?.toLowerCase()];
	const state = args[1]?.toLowerCase();

	if (!feature || !["on", "off"].includes(state)) {
		const list = Object.entries(FEATURES)
			.map(([k, [field, label]]) => `${data[field] ? "✅" : "❌"} *${k}* — ${label}`)
			.join("\n");
		return sendMessageWTyping(
			from,
			{ text: `⚙️ *Group Features*\n\n${list}\n\n💡 _toggle <feature> on|off_` },
			{ quoted: msg },
		);
	}

	await group.updateOne({ _id: from }, { $set: { [feature[0]]: state === "on" } });
	sendMessageWTyping(
		from,
		{ text: `${state === "on" ? "✅" : "❌"} *${args[0].toLowerCase()}* turned *${state}* for this group.` },
		{ quoted: msg },
	);
};

export default () => ({
	cmd: ["toggle", "features"],
	desc: "See or switch this group's features (bot, eva, img, autosticker, ranknotif, only91).",
	usage: "toggle | toggle <feature> on|off",
	handler,
});
