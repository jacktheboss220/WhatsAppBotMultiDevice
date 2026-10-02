import { delay } from "baileys";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	if (!args[0]) return sendMessageWTyping(from, { text: "Please provide a message to broadcast" }, { quoted: msg });

	const groups = await sock.groupFetchAllParticipating();
	const res = Object.keys(groups);

	let message = `📢 *Broadcast*\n\n${args.join(" ")}`;

	let sent = 0;
	for (let i = 0; i < res.length; i++) {
		try {
			await sendMessageWTyping(res[i], { text: message });
			sent++;
		} catch (err) {
			console.log(err);
		}
		await delay(2000);
	}
	return sendMessageWTyping(
		from,
		{ text: `✅ Broadcast sent to *${sent}*/${res.length} groups.` },
		{ quoted: msg }
	);
};

export default () => ({
	cmd: ["bb", "broadcast"],
	desc: "Send a message to all groups.",
	usage: "broadcast <message>",
	handler,
});
