require('dotenv').config();
const myNumber = process.env.MY_NUMBER + '@s.whatsapp.net';
const { member } = require('../../mongo-DB/membersDataDb')

const handler = async (sock, msg, from, args, msgInfoObj) => {

    const { command, botNumberJid, sendMessageWTyping } = msgInfoObj;

    if (!msg.message.extendedTextMessage)
        return sendMessageWTyping(from, { text: "❎ Tag / mentioned!" }, { quoted: msg });

    let taggedJid;

    taggedJid = msg.message.extendedTextMessage ?
        msg.message.extendedTextMessage.contextInfo.participant :
        msg.message.extendedTextMessage.contextInfo.mentionedJid[0];

    taggedJid = taggedJid.includes(":") ?
        taggedJid.split(":")[0] :
        taggedJid.split("@")[0];

    console.log(taggedJid, botNumberJid);

    if ((taggedJid == botNumberJid.split("@")[0]) || (taggedJid == myNumber.split("@")[0]))
        return sendMessageWTyping(from, { text: `_Command Can't be used on Bot / Mod / Owner_.💀` }, { quoted: msg });

    if (command == "block") {
        member.updateOne({ _id: taggedJid + "@s.whatsapp.net" }, { $set: { isBlock: true } }).then(() => {
            sendMessageWTyping(from, { text: `❎ Blocked`, }, { quoted: msg });
        });
    }

    if (command == "unblock") {
        member.updateOne({ _id: taggedJid + "@s.whatsapp.net" }, { $set: { isBlock: false } }).then(() => {
            sendMessageWTyping(from, { text: `✅ *Unblocked*` }, { quoted: msg })
        });
    }
}

module.exports.command = () => ({
    cmd: ["block", "unblock"],
    desc: "Block / Unblock a user",
    usage: "block | unblock | tag / mention the user | reply to a message to block / unblock",
    handler
});