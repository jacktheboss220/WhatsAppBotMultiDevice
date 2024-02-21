require('dotenv').config();
const PIN_KEY = process.env.PIN_KEY || "";

const axios = require("axios");
module.exports.command = () => {
    let cmd = ["pin", "pd"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;

    if (!PIN_KEY)
        return sendMessageWTyping(from,
            { text: "```Pinterest API Key is Missing```" },
            { quoted: msg }
        );

    if (!args[0] || !args[0].includes("https://pin.it")) return sendMessageWTyping(from, { text: "Provide the pinurl" }, { quoted: msg });
    axios.get(`https://api.xteam.xyz/dl/pinterestdl?url=${args[0]}/&APIKEY=${PIN_KEY}`).then((res) => {
        if (res.data.status == true) {
            res.data.result.hd_img ? res.data.result.hd_img.endsWith('mp4')
                ? sendMessageWTyping(from, { video: { url: res.data.result.hd_img } }, { quoted: msg })
                : sendMessageWTyping(from, { image: { url: res.data.result.hd_img } }, { quoted: msg })
                : res.data.result.high_img ? res.data.result.high_img.endsWith('mp4')
                    ? sendMessageWTyping(from, { video: { url: res.data.result.high_img } }, { quoted: msg })
                    : sendMessageWTyping(from, { image: { url: res.data.result.high_img } }, { quoted: msg })
                    : sendMessageWTyping(from, { text: "Not Found / Error" })
        } else {
            sendMessageWTyping(from, { text: "error" }, { quoted: msg })
        }
        console.log(JSON.stringify(res.data));
    })
}