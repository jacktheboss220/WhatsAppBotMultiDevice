const { getGroupData, createGroupData, group } = require('../../../mongo-DB/groupDataDb');
const { createMembersData, getMemberData, member } = require('../../../mongo-DB/membersDataDb');

require('dotenv').config();
const myNumber = process.env.MY_NUMBER + '@s.whatsapp.net';

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { command, groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;
    try {
        if (!msg.message.extendedTextMessage) {
            return sendMessageWTyping(from, { text: "❎ Tag someone! or reply to a message" }, { quoted: msg });
        }

        let taggedJid = msg.message.extendedTextMessage.contextInfo.participant || msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        taggedJid = taggedJid.includes(":") ? taggedJid.split(":")[0] + "@s.whatsapp.net" : taggedJid;

        let isGroupAdmin = groupAdmins.includes(taggedJid);
        if (command != "unwarn") {
            if (taggedJid == botNumberJid) return sendMessageWTyping(from, { text: `_How can I warn Myself_` }, { quoted: msg });
            if (taggedJid == myNumber) return sendMessageWTyping(from, { text: `_Owner or Moderator cannot be warned_` }, { quoted: msg });
        }
        const groupData = await getGroupData(from);
        const memberData = await getMemberData(taggedJid);
        let warnCount = 0;
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
        let num_split = taggedJid.split("@s.whatsapp.net")[0];
        let warnMsg;
        switch (command) {
            case 'warn':
                try {
                    warnMsg = `@${num_split} 😒,You've been warned. Status of warning ${(++warnCount)} / 3. Do not repeat this sort of action or you will be kicked!`;
                    sock.sendMessage(from, {
                        text: warnMsg,
                        mentions: [taggedJid]
                    });
                    group.updateOne({ _id: from, "memberWarnCount.member": taggedJid }, { $inc: { "memberWarnCount.$.count": 1 } }).then(r => {
                        if (r.matchedCount == 0)
                            group.updateOne({ _id: from }, { $push: { "memberWarnCount": { member: taggedJid, count: warnCount } } });
                    });
                    member.updateOne({ _id: taggedJid, "warning.group": from }, { $inc: { "warning.$.count": 1 } }).then((r) => {
                        if (r.matchedCount == 0)
                            member.updateOne({ _id: taggedJid }, { $push: { "warning": { group: from, count: warnCount } } });
                        if (warnCount >= 3) {
                            if (!groupAdmins.includes(botNumberJid)) {
                                sendMessageWTyping(from, { text: "❎ I'm not Admin here!" }, { quoted: msg });
                                return;
                            }
                            if (isGroupAdmin) {
                                sendMessageWTyping(from, { text: "❎ Cannot remove admin!" }, { quoted: msg });
                                return;
                            }
                            sock.groupParticipantsUpdate(from, [taggedJid], "remove");
                            sendMessageWTyping(from, { text: "✅ The number has been removed from the group!" }, { quoted: msg });
                        }
                    }).catch(err => {
                        console.log(err);
                    });
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

module.exports.command = () => ({
    cmd: ["warn", "unwarn"],
    desc: "Warn a member",
    usage: "warn @mention | unwarn @mention | reply",
    handler
});
