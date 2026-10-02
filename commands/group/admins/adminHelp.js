import { cmdToText } from "../../../utils/commandLoader.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { prefix, sendMessageWTyping } = msgInfoObj;
	const { adminCommands } = await cmdToText();

	const line = (c) => `▸ *${prefix}${c.cmd[0]}*${c.cmd.length > 1 ? ` _(${c.cmd.slice(1).map((a) => prefix + a).join(", ")})_` : ""}\n   ${c.desc}`;
	const text =
		`🛡️ *Admin Commands*\n${readMore}\n` +
		adminCommands.map(line).join("\n\n") +
		`\n\n💡 _${prefix}help <command> for usage_\n♥ buymeacoffee.com/jacktheboss220`;

	sendMessageWTyping(from, { text }, { quoted: msg });
};

export default () => ({
	cmd: ["admin"],
	desc: "Show all admin commands.",
	usage: "admin",
	handler,
});
