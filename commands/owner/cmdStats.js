import { getCommandStats } from "../../db/cmdStats.js";
import { cmdToText } from "../../utils/commandLoader.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, isGroup } = msgInfoObj;
	const here = args[0] === "here" && isGroup;
	const stats = await getCommandStats(here ? from : undefined);

	if (!stats.length) return sendMessageWTyping(from, { text: "No command usage recorded yet." }, { quoted: msg });

	const total = stats.reduce((n, s) => n + s.count, 0);
	const top = stats.slice(0, 15).map((s, i) => `${i + 1}. *${s._id}* — ${s.count}`).join("\n");

	let text = `📊 *Command Usage ${here ? "(this group)" : "(all chats)"}*\nTotal: ${total}\n\n${top}`;

	if (!here) {
		const { publicCommands, groupCommands, adminCommands, ownerCommands } = await cmdToText();
		const used = new Set(stats.map((s) => s._id));
		const unused = [...publicCommands, ...groupCommands, ...adminCommands, ...ownerCommands]
			.map((c) => c.cmd[0])
			.filter((c) => !used.has(c));
		if (unused.length) text += `\n\n💤 *Never used (${unused.length})*\n${unused.join(", ")}`;
	}
	sendMessageWTyping(from, { text }, { quoted: msg });
};

export default () => ({
	cmd: ["stats", "cmdstats"],
	desc: "Show the most used commands and the ones never used. Add 'here' for this group only.",
	usage: "stats | stats here",
	handler,
});
