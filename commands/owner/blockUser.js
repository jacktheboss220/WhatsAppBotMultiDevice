require('dotenv').config();
const myNumber = process.env.myNumber + '@s.whatsapp.net';
const { setBlockWarning, removeBlockWarning } = require('../../DB/blockDB');

module.exports.command = () => {
    let cmd = ["block", "unblock"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { command, botNumberJid, sendMessageWTyping } = msgInfoObj;
    if (!msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: "❌ Tag / mentioned!" }, { quoted: msg });
    let taggedJid;
    taggedJid = msg.message.extendedTextMessage ? msg.message.extendedTextMessage.contextInfo.participant : msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    taggedJid = taggedJid.includes(":") ? taggedJid.split(":")[0] : taggedJid.split("@")[0];
    if (taggedJid == botNumberJid) return sendMessageWTyping(from, { text: `_How I can Block Myself_.😂` }, { quoted: msg });
    if (taggedJid == myNumber) return sendMessageWTyping(from, { text: `🙄 _Can't Block Owner or Moderator_ 😊` }, { quoted: msg });

    if (command == "block") {
        await setBlockWarning(taggedJid).then(() => {
            let num_split = taggedJid + "@s.whatsapp.net";
            let warnMsg = `@${taggedJid} ,❌ You can't use the bot.`;
            sendMessageWTyping(
                from,
                {
                    text: warnMsg,
                    mentions: [num_split]
                },
                { quoted: msg }
            );
        });
    }
    if (command == "unblock") {
        await removeBlockWarning(taggedJid).then(() => {
            sendMessageWTyping(from, { text: `✔️ *Unblocked*` }, { quoted: msg })
        });
    }
}

