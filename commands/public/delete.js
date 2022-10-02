module.exports.command = () => {
    let cmd = ["delete", "d", "del"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { botNumberJid, sendMessageWTyping } = msgInfoObj;

    try {
        if (!msg.message.extendedTextMessage) {
            return sendMessageWTyping(from, { text: `❌ Tag message of bot to delete.` }, { quoted: msg });
        }
        if (!(msg.message.extendedTextMessage.contextInfo.participant == botNumberJid)) {
            return sendMessageWTyping(from, { text: `❌ Tag message of bot to delete.` }, { quoted: msg });
        }
        const options = {
            remoteJid: botNumberJid,
            fromMe: true,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId
        }
        sendMessageWTyping(
            from,
            { delete: options }
        )
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}