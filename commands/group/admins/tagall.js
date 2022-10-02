module.exports.command = () => {
    let cmd = ["tagall"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    const groupMetadata = await sock.groupMetadata(from);
    let jid = [];
    let message = '';
    try {
        if (
            msg.message.extendedTextMessage &&
            msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation
        ) {
            message +=
                msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation + "\n\n";
        } else {
            message += args.length ? args.join(" ") + "\n\n" : "```Total Members : " + groupMetadata.participants.length + "```\n\n";
        }
        for (let i of groupMetadata.participants) {
            message += "👉🏻 @" + i.id.split("@")[0] + "\n";
            jid.push(i.id);
        }
        sock.sendMessage(
            from,
            {
                text: message,
                mentions: jid
            },
        )
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}