const { getGroupData, group } = require('../../mongo-DB/groupDataDb');
const { getMemberData, member } = require('../../mongo-DB/membersDataDb');
const { getBotData, bot } = require('../../mongo-DB/botDataDb');

const updateData = async (collection, id, data, value, sendMessageWTyping, from, msg) => {
    if (value.match(/^[0-9]+$/)) value = Number(value);
    if (value === "true") value = true;
    if (value === "false") value = false;
    await collection.updateOne({ _id: id }, { $set: { [data]: value } });
    sendMessageWTyping(from, { text: "Command Executed" }, { quoted: msg });
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, command } = msgInfoObj;
    let data, value, id, collection, getDataFunc;

    switch (command) {
        case "group":
            collection = group;
            getDataFunc = getGroupData;
            id = from;
            break;
        case "member":
            if (!msg.message.extendedTextMessage) {
                return sendMessageWTyping(from, { text: "*Reply On User's Message.*" }, { quoted: msg });
            }
            collection = member;
            getDataFunc = getMemberData;
            id = msg.message.extendedTextMessage.contextInfo.participant;
            break;
        case "bot":
            collection = bot;
            getDataFunc = getBotData;
            id = "bot";
            break;
        default:
            return;
    }

    if (!args[0]) {
        const data = await getDataFunc(id);
        sendMessageWTyping(from, { text: JSON.stringify(data, null, 2, 100) }, { quoted: msg });
    } else {
        [data, value] = args[0].split(":");
        await updateData(collection, id, data, value, sendMessageWTyping, from, msg);
    }
};

module.exports.command = () => ({
    cmd: ["group", "member", "bot"],
    desc: "Control Database",
    usage: "group | member | bot",
    handler
});
