const axios = require('axios');

module.exports.command = () => {
    let cmd = ["tts", "attp"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;
    if (!args[0]) return sendMessageWTyping(from, { text: `❌ *Enter some text*` }, { quoted: msg });
    let uri = encodeURI(evv);

    await axios.get(
        "https://api.xteam.xyz/attp?file&text=" + uri,
        { responseType: "arraybuffer" }
    ).then((ttinullimage) => {
        sock.sendMessage(
            from,
            {
                sticker: Buffer.from(ttinullimage.data)
            }
        );
    }).catch((error) => {
        console.log(error);
        sendMessageWTyping(from, { text: `_Daily Api Limit Exceeds_\n_Wait For SomeTime_` }, { quoted: msg });
    });

}