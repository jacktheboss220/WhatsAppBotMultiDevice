module.exports.command = () => {
    let cmd = ["dd", "ddel"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { senderJid, groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;
    if (!groupAdmins.includes(botNumberJid)) return sendMessageWTyping(from, { text: `❌ Bot Need to be admin in order to delete members message` }, { quoted: msg });

    if (!msg.message.extendedTextMessage) {
        return sendMessageWTyping(from, { text: `❌ Tag message to delete.` }, { quoted: msg });
    }
    try {
        const options = {
            remoteJid: from,
            fromMe: false,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
        }

        sock.sendMessage(
            from,
            { delete: options }
        )
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}