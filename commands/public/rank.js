import { getMemberData } from "../../db/members.js";
import { getGroupData } from "../../db/groupData.js";
import { getRank } from "../../utils/ranks.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { senderJid, sendMessageWTyping, isGroup, extendedMessageOriginal } = msgInfoObj;

	const mentions = extendedMessageOriginal?.mentionedJid || [];
	const targetJid = mentions[0] || senderJid;

	const data = await getMemberData(targetJid);
	if (data === -1) {
		return sendMessageWTyping(
			from,
			{ text: "❌ No data found. Send some messages first!" },
			{ quoted: msg },
		);
	}

	let count = data.totalmsg || 0;
	let groupRankLine = "";

	if (isGroup) {
		const grpData = await getGroupData(from);
		if (grpData?.members?.length) {
			const memberEntry = grpData.members.find((m) => m.id === targetJid);
			if (memberEntry) count = memberEntry.count || 0;

			const sorted = [...grpData.members].sort((a, b) => (b.count || 0) - (a.count || 0));
			const pos = sorted.findIndex((m) => m.id === targetJid) + 1;
			if (pos > 0) groupRankLine = `\n🏆 *Group Rank:* #${pos} of ${sorted.length}`;
		}
	}

	const rank = getRank(count);
	const name = data.username || targetJid.split("@")[0];
	const text =
		`📊 *${name}*\n` +
		`━━━━━━━━━━━━━━━━\n` +
		`${rank.emoji} *${rank.name}*\n` +
		`💬 *Messages:* ${count.toLocaleString()}` +
		groupRankLine;

	return sendMessageWTyping(from, { text }, { quoted: msg });
};

export default () => ({
	cmd: ["rank", "level", "xp"],
	desc: "Check your rank in this group. Tag someone to check theirs.",
	usage: "rank [@user]",
	handler,
});
