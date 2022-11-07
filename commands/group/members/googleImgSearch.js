const gis = require("g-i-s");
const { getGroupData } = require('../../../mongo-DB/groupDataDb');
module.exports.command = () => {
    let cmd = ["img"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;
    let data = await getGroupData(from);
    if (data.isImgOn == false) return sendMessageWTyping(from, { text: "By Default Search Image is Disable in this group." }, { quoted: msg })
    if (!args[0] && msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: "Enter Word to Search" }, { quoted: msg });
    gis(evv, (err, res) => {
        if (err) return sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        let count = Math.ceil(Math.random() * res.length);
        sendMessageWTyping(from, { image: { url: res[count].url } }, { quoted: msg })
    })
}