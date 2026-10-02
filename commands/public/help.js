import dotenv from "dotenv";
dotenv.config();

import { cmdToText } from "../../utils/commandLoader.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { isGroup, sendMessageWTyping } = msgInfoObj;
	let prefix = process.env.PREFIX;

	const { publicCommands, groupCommands, adminCommands, ownerCommands, directCommands } = await cmdToText();

	if (args.length > 0) {
		const query = args[0].toLowerCase().replace(/^[-/]/, "");
		const all = [...publicCommands, ...groupCommands, ...adminCommands, ...ownerCommands];
		const found = all.find((c) => c.cmd.includes(query));
		if (!found) {
			return sendMessageWTyping(from, { text: `❌ No command found: *${query}*` }, { quoted: msg });
		}
		const aliases = found.cmd.filter((c) => c !== found.cmd[0]).map((c) => `${prefix}${c}`).join("  |  ");
		const text =
			`📖 *${prefix}${found.cmd[0]}*\n\n` +
			`*Description:* ${found.desc}\n` +
			`*Usage:* \`${prefix}${found.usage}\`` +
			(aliases ? `\n*Aliases:* ${aliases}` : "");
		return sendMessageWTyping(from, { text }, { quoted: msg });
	}

	const adminCmd = adminCommands.filter((cmd) => cmd.cmd.includes("admin"));
	const ownerCmd = ownerCommands.filter((cmd) => cmd.cmd.includes("owner"));

	const line = (c) => `▸ *${prefix}${c.cmd[0]}*${c.cmd.length > 1 ? ` _(${c.cmd.slice(1).map((a) => prefix + a).join(", ")})_` : ""}
   ${c.desc}`;
	const section = (title, list) => (list.length ? `
*━━ ${title} ━━*
${list.map(line).join("\n\n")}
` : "");
	const footer = `
💡 _${prefix}help <command> for usage_
♥ buymeacoffee.com/jacktheboss220`;

	const help = `🤖 *Eʋα Bσƚ — Menu*
${readMore}` +
		section("🌐 PUBLIC", publicCommands) +
		section("👥 GROUP", groupCommands) +
		section("🛡️ ADMIN", adminCmd) +
		section("👑 OWNER", ownerCmd) +
		footer;

	const helpInDm = `🤖 *Eʋα Bσƚ — DM Menu*
` + section("💬 DM COMMANDS", directCommands) + footer;

	await sendMessageWTyping(from, {
		text: isGroup ? help : helpInDm,
	});
};

export default () => ({
	cmd: ["help", "menu"],
	desc: "Show this menu, or details of one command.",
	usage: "help [command]",
	handler,
});
