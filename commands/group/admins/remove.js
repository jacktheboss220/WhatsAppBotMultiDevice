require('dotenv').config;
const myNumber = process.env.MY_NUMBER + '@s.whatsapp.net';

const handler = async (sock, msg, from, args, msgInfoObj) => {

    const { groupAdmins, sendMessageWTyping, groupMetadata, botNumberJid } = msgInfoObj;
    // return sendMessageWTyping(
    //     from,
    //     { text: "```❎ The admin commands are blocked for sometime to avoid ban on whatsapp!```" },
    //     { quoted: msg }
    // );

    if (!groupAdmins.includes(botNumberJid)) {
        return sendMessageWTyping(from, { text: `❎ I'm not admin here` }, { quoted: msg });
    }

    if (!msg.message.extendedTextMessage) {
        return sendMessageWTyping(from, { text: `*Mention or tag member.*` }, { quoted: msg });
    }

    const taggedJid = msg.message.extendedTextMessage.contextInfo.participant || msg.message.extendedTextMessage.contextInfo.mentionedJid[0];

    if (taggedJid === groupMetadata.owner || taggedJid === myNumber || groupAdmins.includes(taggedJid)) {
        return sendMessageWTyping(from, { text: `❎ *Can't remove Bot/Owner/admin*` }, { quoted: msg });
    }

    try {
        await sock.groupParticipantsUpdate(from, [taggedJid], "remove").then(() => {
            sendMessageWTyping(from, { text: `✅ *Removed*` }, { quoted: msg });
        }).catch((err) => {
            console.log(err);
        });
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    }
};

module.exports.command = () => ({
    cmd: ["remove", "kick", "ban"],
    desc: "Remove a member from group.",
    usage: "remove @mention | reply",
    handler
});
