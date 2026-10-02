const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	sendMessageWTyping(from, { text: from }, { quoted: msg });
};

export default () => ({
	cmd: ["jid", "lid"],
	desc: "Show your JID or LID.",
	usage: "jid | lid",
	handler,
});
