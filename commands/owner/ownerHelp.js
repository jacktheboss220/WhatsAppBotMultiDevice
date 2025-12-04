import { cmdToText } from "../../functions/getAddCommands.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { prefix, sendMessageWTyping } = msgInfoObj;
	const { ownerCommands } = await cmdToText();

	const owner = `
--------------------------------------------------------------
    ─「  *Owner Commands* 」─
---------------------------------------------------------------

${readMore}

${ownerCommands
	.map((cmd) => `*${prefix}${cmd.cmd.join(", ")}* - ${cmd.desc}\nUsage: ${prefix}${cmd.usage}`)
	.join("\n\n")}

♥ мα∂є ωιтн ℓσνє, υѕє ωιтн ℓσνє ♥️`;

	sendMessageWTyping(from, { text: owner });
};

export default () => ({
	cmd: ["owner", "ownerhelp", "ownermenu"],
	desc: "Owner help menu",
	usage: "owner",
	handler,
});
