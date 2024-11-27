const axios = require('axios')

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

module.exports.command = () => ({
    cmd: ['proquote', 'pqoute'],
    desc: 'Get random programming quote',
    usage: 'proquote',
    handler
});