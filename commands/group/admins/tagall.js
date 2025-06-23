const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { prefix, sendMessageWTyping, groupMetadata, type, content } = msgInfoObj;
	if (msg.message.extendedTextMessage) {
		let temp =
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
			msg.message?.conversation;
		msg["message"] = msg.message.extendedTextMessage.contextInfo.quotedMessage;
		msg["message"]["conversation"] = temp;
	}

	const isMedia = type === "imageMessage" || type === "videoMessage";
	const isTaggedImage = type === "extendedTextMessage" && content.includes("imageMessage");
	const isTaggedVideo = type === "extendedTextMessage" && content.includes("videoMessage");

	try {
		if (isMedia || isTaggedImage || isTaggedVideo) {
			delete msg["message"]["conversation"];
			let tempMess = Object.assign({}, msg.message);
			const tempCaption = tempMess[Object.keys(tempMess)[0]]["caption"] ?? "";
			tempMess[Object.keys(tempMess)[0]]["caption"] = tempCaption.includes(prefix + "tagall")
				? tempCaption.split(prefix + "tagall")[1].trim()
				: tempCaption;
			const tags = groupMetadata.participants.map((i) => "👉🏻 @" + i.id.split("@")[0]).join("\n");
			const tt = await sock.sendMessage(from, {
				forward: {
					key: {
						remoteJid: msg.key.remoteJid,
						fromMe: msg.key.fromMe,
						id: msg.key.id,
						participant: msg.key.participant ? msg.key.participant : null,
					},
					messageTimestamp: msg.messageTimestamp,
					pushName: msg.pushName,
					broadcast: msg.broadcast,
					message: tempMess,
				},
				contextInfo: { forwardingScore: 0, isForwarded: false },
			});
			await sock.sendMessage(
				from,
				{
					text: "*Total Members* : " + groupMetadata.participants.length + "\n\n" + tags,
					mentions: [...groupMetadata.participants.map((e) => e.id)],
				},
				{ quoted: tt }
			);
		} else {
			let message = msg.message.conversation ?? "";
			message = message.includes(prefix + "tagall") ? message.split(prefix + "tagall")[1].trim() : message;
			message = message ? message + "\n\n" : "*Total Members* :" + groupMetadata.participants.length + "\n\n";
			message += groupMetadata.participants.map((i) => "👉🏻 @" + i.id.split("@")[0]).join("\n");
			sendMessageWTyping(from, {
				text: message,
				mentions: [...groupMetadata.participants.map((e) => e.id)],
			});
		}
	} catch (err) {
		console.log(err);
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
	}
};

module.exports.command = () => ({
	cmd: ["tagall"],
	desc: "Tag all members in group",
	usage: "tagall | tagall <message> | reply with tagall",
	handler,
});
