const { getGroupData, createGroupData, group } = require('../../../mongo-DB/groupDataDb');
const { createMembersData, getMemberData, member } = require('../../../mongo-DB/membersDataDb');


require('dotenv').config();
const myNumber = process.env.myNumber + '@s.whatsapp.net';

module.exports.command = () => {
    let cmd = ["warn", "warning", "unwarn"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { command, groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;
    try {
        if (!msg.message.extendedTextMessage) {
            sendMessageWTyping(from, { text: "❌ Tag someone! or reply on message" }, { quoted: msg });
            return;
        }
        let taggedJid;
        if (msg.message.extendedTextMessage.contextInfo.participant) {
            taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
        } else {
            taggedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        let isGroupAdmin = groupAdmins.includes(taggedJid);
        if (command != "unwarn") {
            if (taggedJid == botNumberJid) return sendMessageWTyping(from, { text: `_How I can warn Myself_` }, { quoted: msg });
            if (taggedJid == myNumber) return sendMessageWTyping(from, { text: `_Can't warn Owner or Moderator_` }, { quoted: msg });
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
        switch (command) {
            case 'warn':
            case 'warning':
                warnMsg = `@${num_split} 😒,You have been warned. Warning status (${warnCount + 1
                    }/3). Don't repeat this type of behavior again or soon kick!`;
                sock.sendMessage(
                    from,
                    {
                        text: warnMsg,
                        mentions: [taggedJid]
                    }
                )
                group.updateOne({ _id: from, "memberWarnCount.member": taggedJid }, { $inc: { "memberWarnCount.$.count": 1 } }).then(r => {
                    if (r.matchedCount == 0)
                        group.updateOne({ _id: from }, { $push: { "memberWarnCount": { member: taggedJid, count: 1 } } });
                })
                member.updateOne({ _id: taggedJid, "warning.group": from }, { $inc: { "warning.$.count": 1 } }).then((r) => {
                    if (r.matchedCount == 0)
                        member.updateOne({ _id: taggedJid }, { $push: { "warning": { group: from, count: 1 } } });
                    if (warnCount >= 2) {
                        if (!sock.user.id) {
                            sendMessageWTyping(from, { text: "❌ I'm not Admin here!" }, { quoted: msg });
                            return;
                        }
                        if (isGroupAdmin) {
                            sendMessageWTyping(from, { text: "❌ Cannot remove admin!" }, { quoted: msg });
                            return;
                        }
                        sock.groupParticipantsUpdate(
                            from,
                            [taggedJid],
                            "remove"
                        )
                        sendMessageWTyping(from, { text: "✔ Number removed from group!" }, { quoted: msg });
                    }
                }).catch(err => {
                    console.log(err);
                })
                break;
            case 'unwarn':
                member.updateOne({ _id: taggedJid, "warning.group": from }, { $pull: { "warning": { group: from } } }).then(() => {
                    sendMessageWTyping(from, { text: `Set Warn Count to 0 for this user.` }, { quoted: msg });
                })
                group.updateOne({ _id: from, "memberWarnCount.member": taggedJid }, { $pull: { "memberWarnCount": { member: taggedJid } } })
                break;
        }
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg })
    }
}