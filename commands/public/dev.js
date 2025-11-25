const handler = async (sock, msg, from, args, msgTnfoObj) => {
	const { sendMessageWTyping } = msgTnfoObj;

	const text = `*👨‍💻 Developer Info – Mahesh Kumar*\n
╭─────────────⭓
│
│ *🔗 GitHub:*
│ https://github.com/jacktheboss220
│
│ *📢 Telegram Channel:*
│ https://t.me/jackthebosss
│
│ *🌐 Portfolio:*
│ https://www.jacktheboss220.com
│
╰─────────────⭓`;

	await sendMessageWTyping(from, { text }, { quoted: msg });
};

export default () => ({
	cmd: ["dev", "developer"],
	desc: "Developer info",
	usage: "dev | developer",
	handler,
});
