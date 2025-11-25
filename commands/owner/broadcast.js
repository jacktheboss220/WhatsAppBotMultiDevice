import { delay } from "baileys";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	if (!args[0]) return sendMessageWTyping(from, { text: "Please provide a message to broadcast" }, { quoted: msg });

	const groups = await sock.groupFetchAllParticipating();
	const res = Object.keys(groups);

	let message = "*Broadcast message from owner.*\n\n" + args.join(" ");

	try {
		for (let i = 0; i < res.length; i++) {
			await sendMessageWTyping(res[i], { text: message });
			await delay(2000);
			if (i == res.length - 1)
				return sendMessageWTyping(from, { text: "Broadcasted to " + res.length + " groups" }, { quoted: msg });
		}
	} catch (err) {
		console.log(err);
	}
};

export default () => ({
	cmd: ["bb", "broadcast"],
	desc: "Broadcast message to all groups",
	usage: "broadcast <message>",
	handler,
});
