module.exports.command = () => {
    let cmd = ["hidetag", "prank"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { isGroup, sendMessageWTyping } = msgInfoObj;
    let target = '';
    if (!isGroup) target = args[0];
    const groupMetadata = sock.groupMetadata(isGroup ? from : target);
    let jid = [];
    let message = '';
    try {
        if (
            msg.message.extendedTextMessage &&
            msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation
        ) {
            message +=
                msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
        } else {
            message += args.length ? args.join(" ") : "```Hidden Tag By Owner```";
        }
        for (let i of groupMetadata.participants) {
            jid.push(i.id);
        }
        sendMessageWTyping(
            from,
            {
                text: message,
                mentions: jid
            },
        )
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: 'Error' }, { quoted: msg });
    }
}