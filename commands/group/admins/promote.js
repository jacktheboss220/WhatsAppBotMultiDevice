module.exports.command = () => {
    let cmd = ["promote"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {

    let { groupMetadata, groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;
    if (!groupAdmins.includes(botNumberJid)) return sendMessageWTyping(from, { text: `*❌ I'm not admin here*` }, { quoted: msg });

    if (!msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: `*Mention or tag member.*` }, { quoted: msg });
    let taggedJid;
    if (msg.message.extendedTextMessage.contextInfo.participant) {
        taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
        taggedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    if (taggedJid == groupMetadata.owner) return sendMessageWTyping(from, { text: `❌ *Group Owner Tagged*` }, { quoted: msg });
    try {
        await sock.groupParticipantsUpdate(
            from,
            [taggedJid],
            "promote"
        ).then(() => {
            sendMessageWTyping(from, { text: `✔️ *Promoted*` }, { quoted: msg });
        }).catch((err) => {
            console.log(err);
        });
    } catch (err) {
        console.log(err);
    }
}