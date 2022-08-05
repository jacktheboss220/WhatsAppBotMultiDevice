const { getCountWarning } = require('../../../DB/warningDB');

require('dotenv').config();

module.exports.command = () => {
    let cmd = ["getwarn"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { senderjid } = msgInfoObj;

    let taggedJid;
    if (!msg.message.extendedTextMessage) {
        taggedJid = senderjid;
    } else {
        try {
            if (msg.message.extendedTextMessage.contextInfo.participant)
                taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
            else
                taggedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } catch {
            taggedJid = senderjid;
        }
    }
    const warnCount = await getCountWarning(taggedJid, from);
    let num_split = taggedJid.split("@s.whatsapp.net")[0];
    let warnMsg;
    warnMsg = `@${num_split}, Your warning status is (${warnCount}/3) in this group.`;
    sock.sendMessage(
        from,
        {
            text: warnMsg,
            mentions: [taggedJid]
        },
        { quoted: msg }
    );
}