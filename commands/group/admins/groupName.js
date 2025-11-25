const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv } = msgInfoObj;
	if (!args[0]) return sendMessageWTyping(from, { text: "Provide name." }, { quoted: msg });
	try {
		await sock.groupUpdateSubject(from, evv);
	} catch (err) {
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["setname", "setsubject"],
	desc: "Set Group Name",
	usage: "setname <name>",
	handler,
});
