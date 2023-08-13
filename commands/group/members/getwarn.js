require('dotenv').config();

const { getGroupData, createGroupData, group } = require('../../../mongo-DB/groupDataDb');

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
    const groupData = await getGroupData(from);
    let warnCount;
    if (groupData) {
        groupData.memberWarnCount.forEach((element, index) => {
            if (element.member == taggedJid) {
                warnCount = element.count;
                return;
            }
        });
    } else {
        warnCount = 0;
    }
    warnCount = (warnCount == undefined) ? 0 : warnCount;
    let num_split = taggedJid.split("@s.whatsapp.net")[0];
    let warnMsg;
    warnMsg = `@${num_split}, Your warning status is (${warnCount}/3) in this group.`;
    sock.sendMessage(from,
        { text: warnMsg, mentions: [taggedJid] },
        { quoted: msg }
    );
}

module.exports.command = () => ({ cmd: ["getwarn"], handler });