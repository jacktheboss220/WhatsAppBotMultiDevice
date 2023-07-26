module.exports.command = () => {
    let cmd = ["tagall"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    const groupMetadata = await sock.groupMetadata(from);
    let message = '';

    if (!msg.message.extendedTextMessage && args.length === 0) {
        return sendMessageWTyping(from, { text: "```Reply On Any Message```" }, { quoted: msg });
    }

    message += msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation
        ? msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation + "\n\n"
        : args.length ? args.join(" ") + "\n\n" : "```Total Members : " + groupMetadata.participants.length + "```\n\n";

    const mentions = groupMetadata.participants.map(i => i.id);
    message += mentions.map(i => "🔥 @" + i.split("@")[0]).join("\n");

    try {
        sock.sendMessage(from, { text: message, mentions });
    } catch (err) {
        console.error(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
};
