const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { groupAdmins, sendMessageWTyping, botNumber } = msgInfoObj;

	if (!groupAdmins.includes(botNumber[0]) && !groupAdmins.includes(botNumber[1])) {
		return sendMessageWTyping(from, { text: `❎ I'm not admin here` }, { quoted: msg });
	}

	try {
		const gc_invite_code = await sock.groupInviteCode(from);
		const gc_link = `https://chat.whatsapp.com/${gc_invite_code}`;
		sock.sendMessage(from, { text: gc_link, detectLinks: true }, { quoted: msg });
	} catch (err) {
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
		console.error(err);
	}
};

export default () => ({
	cmd: ["link"],
	desc: "Get Group Link",
	usage: "link",
	handler,
});
