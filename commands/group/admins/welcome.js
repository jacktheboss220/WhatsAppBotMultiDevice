const { getGroupData, group } = require('../../../mongo-DB/groupDataDb');
module.exports.command = () => {
    let cmd = ["welcome"];
    return { cmd, handler };
}
const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    let { evv } = msgInfoObj;
    const grpdata = await getGroupData(from);
    let welMess = grpdata.welcome;
    if (!args[0]) {
        sendMessageWTyping(
            from,
            {
                text: (welMess == "") ? "*No Welcome Message is Set type message after welcome cmd to set welcome message*" : "*Welcome Message is :* \n" + welMess
            },
            { quoted: msg }
        )
    } else {
        group.updateOne({ _id: from }, { $set: { welcome: evv } }).then(() => {
            sendMessageWTyping(from, { text: "*Welcome Message Is Set* \n" + evv }, { quoted: msg });
        })
    }
}