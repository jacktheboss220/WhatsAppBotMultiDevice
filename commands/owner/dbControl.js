const { getGroupData, createGroupData, group } = require('../../mongo-DB/groupDataDb');
const { getMemberData, createMembersData, member } = require('../../mongo-DB/membersDataDb');
const { getBotData, createBotData, bot } = require('../../mongo-DB/botDataDb');
module.exports.command = () => {
    let cmd = ["group", "member", "bot"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, command } = msgInfoObj;
    switch (command) {
        case "group":
            if (!args[0]) {
                let data = await getGroupData(from);
                sendMessageWTyping(from, { text: JSON.stringify(data, null, 2, 100) }, { quoted: msg });
            } else {
                let data = args[0].split(":")[0];
                let value = args[0].split(":")[1];
                if (value.match(/^[0-9]+$/))
                    value = Number(value);
                if (value == "true") value = true;
                if (value == "false") value = false;
                group.updateOne({ _id: from }, { $set: { [data]: value } }).then(res => {
                    sendMessageWTyping(from, { text: "Command Executed" }, { quoted: msg })
                })
            }
            break;
        case "member":
            var taggedJid;
            if (msg.message.extendedTextMessage) {
                if (!args[0]) {
                    taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
                    let data = await getMemberData(taggedJid);
                    sendMessageWTyping(from, { text: JSON.stringify(data, null, 100, 2) }, { quoted: msg });
                } else {
                    taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
                    if (args[0] && !args[0].startsWith("@")) {
                        let data = args[0].split(":")[0];
                        let value = args[0].split(":")[1];
                        if (value.match(/^[0-9]+$/))
                            value = Number(value);
                        if (value == "true") value = true;
                        if (value == "false") value = false;
                        member.updateOne({ _id: taggedJid }, { $set: { [data]: value } }).then(res => {
                            sendMessageWTyping(from, { text: "Command Executed" }, { quoted: msg })
                        })
                    }
                }
            } else
                return sendMessageWTyping(from, { text: "*Reply On User's Message.*" }, { quoted: msg })
            break;
        case "bot":
            if (!args[0]) {
                let data = await getBotData("bot");
                sendMessageWTyping(from, { text: JSON.stringify(data, null, 2, 100) }, { quoted: msg });
            } else {
                let data = args[0].split(":")[0];
                let value = args[0].split(":")[1];
                if (value.match(/^[0-9]+$/))
                    value = Number(value);
                if (value == "true") value = true;
                if (value == "false") value = false;
                bot.updateOne({ _id: "bot" }, { $set: { [data]: value } }).then(res => {
                    sendMessageWTyping(from, { text: "Command Executed" }, { quoted: msg })
                })
            }
            break;
    }
}