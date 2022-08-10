require('dotenv').config();
const INSTA_API_KEY = process.env.INSTA_API_KEY;
const { igApi, getSessionId } = require('insta-fetcher');
let ig = new igApi(INSTA_API_KEY);
ig.setCookie(INSTA_API_KEY);


module.exports.command = () => {
    let cmd = ["idp", "dp"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, OwnerSend } = msgInfoObj;
    if (!args[0] || args[0].includes("http")) return sendMessageWTyping(from, { text: `*Provide Username*` }, { quoted: msg })
    let prof = args[0];
    await ig.fetchUser(prof).then((res) => {
        sendMessageWTyping(
            from,
            {
                image: { url: res.hd_profile_pic_url_info.url },
                caption: `𝚂𝚎𝚗𝚍 𝙱𝚢 𝚖𝚢𝙱𝚒𝚝𝙱𝚘𝚝`
            },
            { quoted: msg }
        )
        OwnerSend(JSON.stringify(res));
    }).catch((err) => {
        console.log("Error", err);
        sendMessageWTyping(from, { text: "*Username not found or try again after sometime*" }, { quoted: msg });
    });
}
