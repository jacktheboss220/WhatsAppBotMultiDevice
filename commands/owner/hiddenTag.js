module.exports.command = () => {
    let cmd = ["hidetag","tag", "prank"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping, groupMetadata, type, content } = msgInfoObj;
    if (msg.message.extendedTextMessage) {
        let temp = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
            || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
            || msg.message?.conversation;
        msg['message'] = msg.message.extendedTextMessage.contextInfo.quotedMessage
        msg["message"]['conversation'] = temp;
    }
    const isMedia = type === "imageMessage" || type === "videoMessage";
    const isTaggedImage = type === "extendedTextMessage" && content.includes("imageMessage");
    const isTaggedVideo = type === "extendedTextMessage" && content.includes("videoMessage");

    try {
        if (isMedia || isTaggedImage || isTaggedVideo) {
            delete msg["message"]['conversation'];
            let tempMess = Object.assign({}, msg.message);
            tempMess[Object.keys(tempMess)[0]]['contextInfo'] = {
                "mentionedJid": [...groupMetadata.participants.map(e => e.id)],
            }
            const tempCaption = tempMess[Object.keys(tempMess)[0]]['caption'];
            tempMess[Object.keys(tempMess)[0]]['caption'] = tempCaption.includes(prefix + 'hidetag') ? tempCaption.split(prefix + "hidetag")[1].trim() : tempCaption;
            await sock.sendMessage(from, {
                forward: {
                    "key": {
                        "remoteJid": msg.key.remoteJid,
                        "fromMe": msg.key.fromMe,
                        "id": msg.key.id,
                        "participant": msg.key.participant ? msg.key.participant : null
                    },
                    "messageTimestamp": msg.messageTimestamp,
                    "pushName": msg.pushName,
                    "broadcast": msg.broadcast,
                    "message": tempMess,
                },
                mentions: [...groupMetadata.participants.map(e => e.id)],
                contextInfo: { forwardingScore: 0, isForwarded: false }
            })
        } else {
            let message = msg.message.conversation;
            message = message.includes(prefix + 'hidetag') ? message.split(prefix + "hidetag")[1].trim() : message;
            message = message ? message : "Hidden Tag by Eva";
            sendMessageWTyping(from, {
                text: message,
                mentions: [...groupMetadata.participants.map(e => e.id)]
            });
        }
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}
