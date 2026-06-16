import { cmdToText } from "../../../utils/commandLoader.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { prefix, sendMessageWTyping } = msgInfoObj;
	const { adminCommands } = await cmdToText();

	const admin = `
---------------------------------------------------------------
    ─「 *Admin Commands* 」─
---------------------------------------------------------------
${readMore}

${adminCommands
	.map((cmd) => `*${prefix}${cmd.cmd.join(", ")}* - ${cmd.desc}\nUsage: ${prefix}${cmd.usage}`)
	.join("\n\n")}

♥ мα∂є ωιтн ℓσνє, υѕє ωιтн ℓσνє ♥️`;

	sendMessageWTyping(from, { text: admin }, { quoted: msg });
};

export default () => ({
	cmd: ["admin"],
	desc: "Admin commands list",
	usage: "admin",
	handler,
});
