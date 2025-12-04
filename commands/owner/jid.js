const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	sendMessageWTyping(from, { text: from }, { quoted: msg });
};

export default () => ({
	cmd: ["jid", "lid"],
	desc: "Get your jid or lid",
	usage: "jid | lid",
	handler,
});
