const axios = require('axios')

module.exports.command = () => {
    let cmd = ["proquote", "proq"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    const proURl = 'https://programming-quotes-api.herokuapp.com/Quotes/random';
    await axios(proURl).then((res) => {
        let mess = `: *Programmin Quote* :\n\n${res.data.en}\n~By ${res.data.author}`
        sendMessageWTyping(from, { text: mess }, { quoted: msg })
    }).catch((err) => {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    })
}