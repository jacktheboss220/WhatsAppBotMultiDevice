import dotenv from 'dotenv';
dotenv.config();
import { extractPhoneNumber } from '../../../functions/lidUtils.js';
import { getGroupData } from '../../../mongo-DB/groupDataDb.js';

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
    // Use extractPhoneNumber for LID/PN compatibility
    let phoneNumber = extractPhoneNumber(taggedJid);
    let warnMsg;
    warnMsg = `@${phoneNumber}, Your warning status is (${warnCount}/3) in this group.`;
    sock.sendMessage(from,
        { text: warnMsg, mentions: [taggedJid] },
        { quoted: msg }
    );
}

export default () => ({
    cmd: ["getwarn"],
    desc: "Get warning status of a member",
    usage: "getwarn | reply to a message to get warning status of that member",
    handler
});