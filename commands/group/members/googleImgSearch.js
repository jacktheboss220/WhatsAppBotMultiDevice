const gis = require("g-i-s");

module.exports.command = () => {
    let cmd = ["img"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    if (!args[0] || msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: "Enter Word to Search" }, { quoted: msg });
    gis(args[0], (err, res) => {
        if (err) return sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        let count = Math.ceil(Math.random() * res.length);
        sendMessageWTyping(from, { image: { url: res[count].url } }, { quoted: msg })
    })
}