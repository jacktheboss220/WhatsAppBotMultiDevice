const inshorts = require('inshorts-api');
const axios = require('axios');

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

module.exports.command = () => {
    let cmd = ["news"];
    return { cmd, handler };
}
const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, command, sendMessageWTyping } = msgInfoObj;
    let arr = ['national', 'business', 'sports', 'world', 'politics', 'technology', 'startup', 'entertainment', 'miscellaneous', 'hatke', 'science', 'automobile'];
    let z;
    if (!args[0]) {
        z = arr[0];
    }
    else {
        z = args[0];
    }
    if (!arr.includes(z)) {
        return sendMessageWTyping(from, { text: `Enter a valid category:) or use ${prefix}categories for more info` }, { quoted: msg })
    }

    let news = `☆☆☆☆💥 ${z.toUpperCase()} 💥☆☆☆☆ \n\n${readMore}`;
    var options = {
        lang: 'en',
        category: z,
        numOfResults: 13
    }

    inshorts.get(options, function (result) {
        for (i of result) {
            news = news + "🌐 " + i.title + "\n\n";
        }
        sendMessageWTyping(from, { text: news });
    });
}
