module.exports.command = () => {
    let cmd = ["remove", "ban", "kick"];
    return { cmd, handler };
}
require('dotenv').config;
const myNumber = process.env.myNumber + '@s.whatsapp.net';

const handler = async (sock, msg, from, args, msgInfoObj) => {

    const { groupAdmins, sendMessageWTyping, groupMetadata } = msgInfoObj;

    if (!groupAdmins.includes(sock.user.id)) return sendMessageWTyping(from, { test: `❌ I'm not admin here` }, { quoted: msg });
    if (!msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: `*Mention or tag member.*` }, { quoted: msg });

    let taggedJid;
    if (msg.message.extendedTextMessage.contextInfo.participant) {
        taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
        taggedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    if (taggedJid == groupMetadata.owner || taggedJid == myNumber || groupAdmins.includes(taggedJid)) return sendMessageWTyping(from, { text: `❌ *Can't remove Bot/Owner/admin*` }, { quoted: msg });
    try {
        await sock.groupParticipantsUpdate(
            from,
            [taggedJid],
            "remove"
        ).then(() => {
            sendMessageWTyping(from, { text: `✔️ *Removed*` }, { quoted: msg });
        }).catch((err) => {
            console.log(err);
        });
    } catch (err) {
        console.log(err);
    }
}