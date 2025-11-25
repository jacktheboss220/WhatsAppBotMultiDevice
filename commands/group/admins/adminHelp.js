import { cmdToText } from "../../../functions/getAddCommands.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { prefix } = msgInfoObj;
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

	sock.sendMessage(from, { text: admin });
};

export default () => ({
	cmd: ["admin"],
	desc: "Admin commands list",
	usage: "admin",
	handler,
});
