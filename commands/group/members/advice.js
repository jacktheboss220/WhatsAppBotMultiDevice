const axios = require('axios');

module.exports.command = () => {
    let cmd = ["advice"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    await axios(`https://api.adviceslip.com/advice`).then((res) => {
        sendMessageWTyping(from, { text: `_*-Advice-*_ \n\n` + res.data.slip.advice }, { quoted: msg });
    }).catch((error) => {
        console.log('error', error);
        sendMessageWTyping(from, { text: `Error` }, { quoted: msg });
    });
}