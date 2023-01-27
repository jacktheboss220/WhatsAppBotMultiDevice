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
            sendMessageWTyping(from, { text: "❌ Tag someone! or reply to a message" }, { quoted: msg });
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
            if (taggedJid == botNumberJid) return sendMessageWTyping(from, { text: `_How can I warn Myself_` }, { quoted: msg });
            if (taggedJid == myNumber) return sendMessageWTyping(from, { text: `_Owner or Moderator cannot be warned_` }, { quoted: msg });
        }
        const groupData = await getGroupData(from);
        const memberData = await getMemberData(taggedJid);
        let warnCount;
        if (groupData) {
            try {
                if (groupData.memberWarnCount == undefined || groupData.memberWarnCount.length == undefined) {
                    group.updateOne({ _id: from }, {
                        $set: { memberWarnCount: [] }
                    });
                } else {
                    await groupData.memberWarnCount.forEach((element, index) => {
                        if (element.member == taggedJid) {
                            warnCount = element.count;
                            return;
                        }
                    });
                }
            } catch (err) {
                return sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            }
        } else {
            warnCount = 0;
        }
        if (memberData) {
            try {
                if (memberData.warning == undefined || memberData.warning.length == undefined) {
                    await member.updateOne({ _id: taggedJid }, {
                        $set: { warning: [] }
                    })
                }
            } catch (err) {
                return sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            }
        }
        warnCount = (warnCount == undefined) ? 0 : warnCount;
        let num_split = taggedJid.split("@s.whatsapp.net")[0];
        let warnMsg;
        switch (command) {
            case 'warn':
            case 'warning':
                warnMsg = `@${num_split} 😒,You've been warned. Status of warning ${(warnCount + 1) / 3}. Do not repeat this sort of action or you will be kicked!`;
                sock.sendMessage(
                    from,
                    {
                        text: warnMsg,
                        mentions: [taggedJid]
                    }
                );
                try {
                    group.updateOne({ _id: from, "memberWarnCount.member": taggedJid }, { $inc: { "memberWarnCount.$.count": 1 } }).then(r => {
                        if (r.matchedCount == 0)
                            group.updateOne({ _id: from }, { $push: { "memberWarnCount": { member: taggedJid, count: warnCount } } });
                    });
                    member.updateOne({ _id: taggedJid, "warning.group": from }, { $inc: { "warning.$.count": 1 } }).then((r) => {
                        if (r.matchedCount == 0)
                            member.updateOne({ _id: taggedJid }, { $push: { "warning": { group: from, count: warnCount } } });
                        if (warnCount >= 2) {
                            if (!groupAdmins.includes(botNumberJid)) {
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
                            sendMessageWTyping(from, { text: "✔ The number has been removed from the group!" }, { quoted: msg });
                        }
                    }).catch(err => {
                        console.log(err);
                    })
                } catch (err) {
                    sendMessageWTyping(from, { text: err.toString() }, { quoted: msg })
                }
                break;
            case 'unwarn':
                member.updateOne({ _id: taggedJid, "warning.group": from }, { $pull: { "warning": { group: from } } }).then(() => {
                    sendMessageWTyping(from, { text: `The user's Warn Count has been reset.` }, { quoted: msg });
                })
                group.updateOne({ _id: from, "memberWarnCount.member": taggedJid }, { $pull: { "memberWarnCount": { member: taggedJid } } })
                break;
        }
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg })
    }
}