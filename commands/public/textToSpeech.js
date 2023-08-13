const tts = require('google-tts-api');

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping, evv, content } = msgInfoObj;
    let lang = 'en'
    if (!args[0] && !msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: `❌ Text is empty! \nSend ${prefix}say text` }, { quoted: msg });

    if (!content.includes('conversation')) return sendMessageWTyping(from, { text: `❌ Reply to a message!` }, { quoted: msg });

    let message = evv || msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;

    if (args[0] == 'hin') {
        lang = 'hi-IN'
        message = evv.split("hin")[1].trim();
    }
    if (message == undefined || message == "") return sendMessageWTyping(from, { text: `❌ Text is empty! \nSend ${prefix}say text` }, { quoted: msg });

    if (message.split("").length >= 200) return sendMessageWTyping(from, { text: `❌ Word Limit: ${message.split("").length}/200 \nSend ${prefix}say text` }, { quoted: msg });

    const url = tts.getAudioUrl(message, {
        lang: lang,
        slow: false,
        host: 'https://translate.google.com',
    });

    if (!url) return sendMessageWTyping(from, { text: `❌ Error!` }, { quoted: msg });

    sock.sendMessage(from, {
        audio: { url: url },
        mimetype: 'audio/mpeg',
        fileName: 'eva.mp4',
    }, {
        quoted: msg
    });
};

module.exports.command = () => ({ cmd: ['say'], handler });