const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	const text = `*👨‍💻 Developer — Mahesh Kumar*

╭───────────────────────────
│ *🔗 GitHub*
│ github.com/jacktheboss220
│
│ *☕ Support My Work*
│ buymeacoffee.com/jacktheboss220
│
│ *🌐 Portfolio*
│ jacktheboss220.com
╰───────────────────────────`;

	await sendMessageWTyping(from, { text }, { quoted: msg });
};

export default () => ({
	cmd: ["dev", "developer"],
	desc: "Show info about the developer.",
	usage: "dev | developer",
	handler,
});
