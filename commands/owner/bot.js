const { getGroupData, createGroupData, group } = require('../../mongo-DB/groupDataDb');

module.exports.command = () => {
    let cmd = ["bot"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    if (!args[0]) return;
    let data = args[0].split(":")[0];
    let value = args[0].split(":")[1];
    if (value == "true") value = true;
    if (value == "false") value = false;
    group.updateOne({ _id: from }, { $set: { [data]: value } }).then(res => {
        sendMessageWTyping(from, { text: "Done" }, { quoted: msg })
    })
}