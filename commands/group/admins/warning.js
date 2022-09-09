const {
    getCountWarning,
    setCountWarning,
    removeWarnCount
} = require('../../../DB/warningDB');

require('dotenv').config();
const myNumber = process.env.myNumber + '@s.whatsapp.net';

module.exports.command = () => {
    let cmd = ["warn", "warning", "unwarn"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { command, groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;

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

    const warnCount = await getCountWarning(taggedJid, from);
    let num_split = taggedJid.split("@s.whatsapp.net")[0];
    let warnMsg;
    switch (command) {
        case 'getwarn':
            warnMsg = `@${num_split}, Your warning status is (${warnCount}/3) in this group.`;
            sock.sendMessage(
                from,
                {
                    text: warnMsg,
                    mentions: [taggedJid]
                }
            );
            break;

        case 'warn':
        case 'warning':
            warnMsg = `@${num_split} 😒,You have been warned. Warning status (${warnCount + 1
                }/3). Don't repeat this type of behaviour again or soon kimck!`;
            sock.sendMessage(
                from,
                {
                    text: warnMsg,
                    mentions: [taggedJid]
                }
            )
            await setCountWarning(taggedJid, from);
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
            break;
        case 'unwarn':
            await removeWarnCount(taggedJid, from);
            sendMessageWTyping(from, { text: `Set Warn Count to 0 for this user.` }, { quoted: msg });
            break;
    }
}