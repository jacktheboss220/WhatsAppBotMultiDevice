import axios from "axios";
import { getMemberData } from "../../../db/members.js";

// Deterministic ASCII-based score — sorted so order doesn't matter
const asciiScore = (name1, name2) => {
	const [a, b] = [name1.toLowerCase().trim(), name2.toLowerCase().trim()].sort();
	const sumA = [...a].reduce((s, c) => s + c.charCodeAt(0), 0);
	const sumB = [...b].reduce((s, c) => s + c.charCodeAt(0), 0);
	const h = (sumA * 37 + sumB * 53 + (sumA ^ sumB) * 17) >>> 0;
	return h % 101;
};

const fetchGender = async (name) => {
	try {
		const { data } = await axios.get(`https://api.genderize.io/?name=${encodeURIComponent(name.split(" ")[0])}`);
		return data.gender ? { gender: data.gender, prob: data.probability || 0 } : null;
	} catch {
		return null;
	}
};

// Opposite genders with high confidence → boost; same → slight dip (silent)
const applyGender = (score, g1, g2) => {
	if (!g1?.gender || !g2?.gender) return score;
	const avgProb = (g1.prob + g2.prob) / 2;
	const opposite = g1.gender !== g2.gender;
	const delta = opposite ? Math.round(avgProb * 10) : -Math.round(avgProb * 6);
	return Math.max(0, Math.min(100, score + delta));
};

const shipMessage = (pct) => {
	if (pct <= 10) return ["💀", "Absolutely zero chemistry. Run far away."];
	if (pct <= 25) return ["💔", "Not compatible. Better off as strangers."];
	if (pct <= 40) return ["🤝", "Just friends... maybe forever."];
	if (pct <= 55) return ["🙈", "Something's brewing here... 👀"];
	if (pct <= 70) return ["💛", "Good vibes! Could be something real."];
	if (pct <= 85) return ["💕", "Strong connection! You two fit well."];
	if (pct <= 95) return ["💖", "Almost soulmates! Very strong bond!"];
	return ["💘", "SOULMATES! A perfect match! 🎉"];
};

const resolveFromJid = async (jid, fallbackName) => {
	const d = await getMemberData(jid);
	return (d !== -1 ? d.username : null) || fallbackName || jid.split("@")[0];
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { senderJid, sendMessageWTyping, extendedMessageOriginal, updateName } = msgInfoObj;

	const mentions = extendedMessageOriginal?.mentionedJid || [];
	const quotedParticipant = extendedMessageOriginal?.participant;
	const sanitize = (s) => s.replace(/[^a-zA-Z\s]/g, "").trim();
	const nameArgs = args.filter((a) => !a.startsWith("@")).map(sanitize).filter(Boolean);

	let name1, name2;

	if (mentions.length >= 2) {
		[name1, name2] = await Promise.all([resolveFromJid(mentions[0]), resolveFromJid(mentions[1])]);
	} else if (mentions.length === 1) {
		[name1, name2] = await Promise.all([resolveFromJid(senderJid, updateName), resolveFromJid(mentions[0])]);
	} else if (quotedParticipant) {
		[name1, name2] = await Promise.all([resolveFromJid(senderJid, updateName), resolveFromJid(quotedParticipant)]);
	} else if (nameArgs.length >= 2) {
		[name1, name2] = [nameArgs[0], nameArgs[1]];
	} else if (nameArgs.length === 1) {
		name1 = updateName || senderJid.split("@")[0];
		name2 = nameArgs[0];
	} else {
		return sendMessageWTyping(
			from,
			{
				text:
					`*Love Command*\n\n` +
					`• \`love name1 name2\`\n` +
					`• \`love name\`  _(ships with you)_\n` +
					`• \`love @user1 @user2\`\n` +
					`• Reply to message + \`love\``,
			},
			{ quoted: msg },
		);
	}

	if (name1.toLowerCase().trim() === name2.toLowerCase().trim()) {
		return sendMessageWTyping(from, { text: "🤡 Can't ship someone with themselves." }, { quoted: msg });
	}

	// ASCII score + gender adjustment (parallel)
	const [g1, g2] = await Promise.all([fetchGender(name1), fetchGender(name2)]);
	const base = asciiScore(name1, name2);
	const pct = applyGender(base, g1, g2);

	const [emoji, caption] = shipMessage(pct);
	const shipName = name1.slice(0, Math.ceil(name1.length / 2)) + name2.slice(Math.floor(name2.length / 2));
	const filled = Math.round(pct / 10);
	const bar = "❤️".repeat(filled) + "🖤".repeat(10 - filled);

	const text =
		`${emoji} *Love: ${name1} × ${name2}*\n` +
		`━━━━━━━━━━━━━━━━\n` +
		`💑 *Ship Name:* ${shipName}\n` +
		`💯 *Love Score:* ${pct}%\n` +
		`${bar}\n` +
		`\n💬 _${caption}_`;

	return sendMessageWTyping(from, { text }, { quoted: msg });
};

export default () => ({
	cmd: ["love", "couple"],
	desc: "Ship two people by name or tag. ASCII values + gender for score.",
	usage: "love name1 name2 | love name | love @user1 @user2 | reply",
	handler,
});
