const gis = require("g-i-s");
const { getGroupData } = require('../../../mongo-DB/groupDataDb');
module.exports.command = () => {
    let cmd = ["img"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { sendMessageWTyping, evv } = msgInfoObj;
    let data = await getGroupData(from);
    if (data.isImgOn == false) return sendMessageWTyping(from, { text: "```By Default Search Image is Disable in this group.```" }, { quoted: msg })
    if (args[0].startsWith("@") && msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: "```Enter Word to Search```" }, { quoted: msg });
    if (args[0] == 1) evv = evv.split("1")[1];
    console.log(evv);
    gis(evv, (err, res) => {
        if (err) return sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        if (args[0] == 1) {
            sendMessageWTyping(from, { image: { url: res[0].url } }, { quoted: msg })
        } else {
            let count = Math.ceil(Math.random() * res.length);
            sendMessageWTyping(from, { image: { url: res[count].url } }, { quoted: msg })
        }
    })
}