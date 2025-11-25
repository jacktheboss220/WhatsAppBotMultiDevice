const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { groupAdmins, botNumber, sendMessageWTyping } = msgInfoObj;
	if (!groupAdmins.includes(botNumber[0]) && !groupAdmins.includes(botNumber[1])) {
		return sendMessageWTyping(from, { text: `❎ I'm not an admin here` }, { quoted: msg });
	}

	if (!args[0]) {
		return sendMessageWTyping(from, { text: `❎ *Provide on/off*` }, { quoted: msg });
	}

	args[0] = args[0].toLowerCase();

	try {
		if (args[0] === "off") {
			sock.groupSettingUpdate(from, "announcement");
			sendMessageWTyping(from, { text: `✅ *Only Admin can send Message* ` }, { quoted: msg });
		} else if (args[0] === "on") {
			sock.groupSettingUpdate(from, "not_announcement");
			sendMessageWTyping(from, { text: `✅ *All member can send Message* ` }, { quoted: msg });
		} else {
			return sendMessageWTyping(from, { text: `❎ *Provide right args* ` }, { quoted: msg });
		}
	} catch (err) {
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
		console.error(err);
	}
};

export default () => ({
	cmd: ["chat"],
	desc: "Enable/disable group chat for members.",
	usage: "chat on/off",
	handler,
});
