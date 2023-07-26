const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, botNumberJid } = msgInfoObj;
    const groupMetadata = await sock.groupMetadata(from);
    let message = '';

    try {
        if (msg.message.extendedTextMessage) {
            console.log(msg.message.extendedTextMessage.quotedMessage);
            message = msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
        }
        if (args.length > 0) {
            message = args.join(" ");
        }
        const mention = groupMetadata.participants.filter((p) => p.id != botNumberJid)
        const random = Math.floor(Math.random() * mention.length);
        console.log(message, mention[random].id, mention[random].id.split("@")[0]);
        message += " @" + mention[random].id.split("@")[0];
        if (!args[0])
            sock.sendMessage(from, { text: message, mentions: [mention[random].id] }, { quoted: msg });
        else
            sock.sendMessage(from, { text: message, mentions: [mention[random].id] });
    } catch (err) {
        console.error(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
};

module.exports.command = () => ({ cmd: ["rn", "randomtag"], handler })