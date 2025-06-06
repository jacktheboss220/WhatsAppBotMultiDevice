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

module.exports.command = () => ({
	cmd: ["dev", "developer"],
	desc: "Developer info",
	usage: "dev | developer",
	handler,
});
