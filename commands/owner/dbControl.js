const { getGroupData, createGroupData, group } = require('../../mongo-DB/groupDataDb');
const { getMemberData, createMembersData, member } = require('../../mongo-DB/membersDataDb');
module.exports.command = () => {
    let cmd = ["group", "member"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, command, senderJid } = msgInfoObj;
    switch (command) {
        case "group":
            if (!args[0]) {
                let data = await getGroupData(from);
                sendMessageWTyping(from, { text: JSON.stringify(data, null, 2, 100) }, { quoted: msg });
            } else {
                let data = args[0].split(":")[0];
                let value = args[0].split(":")[1];
                if (value == "true") value = true;
                if (value == "false") value = false;
                group.updateOne({ _id: from }, { $set: { [data]: value } }).then(res => {
                    sendMessageWTyping(from, { text: "Command Executed" }, { quoted: msg })
                })
            }
            break;
        case "member":
            var taggedJid;
            if (msg.message.extendedTextMessage && !args[0]) {
                taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
                let data = await getMemberData(taggedJid ? taggedJid : senderJid);
                sendMessageWTyping(from, { text: JSON.stringify(data, null, 2, 100) }, { quoted: msg });
            } else {
                if (args[0] && !args[0].startsWith("@")) {
                    let data = args[0].split(":")[0];
                    let value = args[0].split(":")[1];
                    if (value == "true") value = true;
                    if (value == "false") value = false;
                    member.updateOne({ _id: senderJid }, { $set: { [data]: value } }).then(res => {
                        sendMessageWTyping(from, { text: "Command Executed" }, { quoted: msg })
                    })
                } else
                    return sendMessageWTyping(from, { text: "*Reply On User's Message.*" }, { quoted: msg })
            }
            break;
    }
}