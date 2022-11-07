const { createMembersData, getMemberData, member } = require('../../../mongo-DB/membersDataDb');

require('dotenv').config();

module.exports.command = () => {
    let cmd = ["getwarn"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { senderJid } = msgInfoObj;

    let taggedJid;
    if (!msg.message.extendedTextMessage) {
        taggedJid = senderJid;
    } else {
        try {
            if (msg.message.extendedTextMessage.contextInfo.participant)
                taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
            else
                taggedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } catch {
            taggedJid = senderJid;
        }
    }
    const memberData = await getMemberData(taggedJid);
    let warnCount;
    memberData.warning.forEach((element, index) => {
        if (element.group == from) {
            warnCount = element.count;
            return;
        }
    });
    warnCount = (warnCount == undefined) ? 0 : warnCount;
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