const axios = require('axios');
module.exports.command = () => {
    let cmd = ["eva"];
    return { cmd, handler };
}
const chaturi = 'https://api.safone.tech/chatbot?query=';
const bot_name = "Eva";
const user_id = 1000;
const bot_master = "Mahesh";

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { evv, sendMessageWTyping } = msgInfoObj;
    if (!args[0]) return sendMessageWTyping(from, { text: `Enter some text` });
    let message = encodeURI(evv);
    axios(chaturi + message + '&user_id=' + user_id + ' &bot_name=' + bot_name + '&bot_master=' + bot_master).then((res) => {
        mas = res.data.answer;
        if (mas.includes("[Safone](t.me/asmsafone)")) mas = mas.replace("[Safone](t.me/asmsafone)", "Mahesh");
        try {
            sendMessageWTyping(
                from,
                {
                    text: '```' + mas + '```',
                    mentions: msg.message.extendedTextMessage ? msg.message.extendedTextMessage.contextInfo.mentionedJid : ""
                },
                { quoted: msg }
            );
        } catch (err) {
            console.log(err);
        }
    }).catch((err) => {
        console.log(err);
        sendMessageWTyping(from, { text: "Error" }, { quoted: msg });
    });
}