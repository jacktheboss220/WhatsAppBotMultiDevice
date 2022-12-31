const { getGroupData, createGroupData, group } = require('../../mongo-DB/groupDataDb');
const { getMemberData, createMembersData, member } = require('../../mongo-DB/membersDataDb');
const axios = require('axios');

module.exports.command = () => {
    let cmd = ["test"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;

    let taggedJid;
    if (msg.message.extendedTextMessage) {
        taggedJid = msg.message.extendedTextMessage ?
            msg.message.extendedTextMessage.contextInfo.participant :
            msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    if (args.length === 0) {
        return sendMessageWTyping(from, { text: `❌ empty query!` }, { quoted: msg });
    }
    try {
        let resultTest = eval(evv);
        if (typeof resultTest === "object")
            sendMessageWTyping(from, { text: JSON.stringify(resultTest) }, { quoted: msg });
        else sendMessageWTyping(from, { text: resultTest.toString() }, { quoted: msg });
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}