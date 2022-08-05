const inshorts = require('inshorts-api');
const axios = require('axios');

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

module.exports.command = () => {
    let cmd = ["news"];
    return { cmd, handler };
}
const url = 'https://news-pvx.herokuapp.com/';
const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, command, sendMessageWTyping } = msgInfoObj;
    if (!args[0]) {
        let count = 0;
        const { data } = await axios(url);
        let news = `☆☆☆☆💥 𝗧𝗲𝗰𝗵 𝗡𝗲𝘄𝘀 💥☆☆☆☆ \n\n${readMore}`;
        data["inshorts"].forEach((headline) => {
            count += 1
            if (count > 13) return;
            news = news + "🌐 " + headline + "\n\n";
        });
        sendMessageWTyping(from, { text: news });
    } else {
        let z = args[0];
        let arr = ['national', 'business', 'sports', 'world', 'politics', 'technology', 'startup', 'entertainment', 'miscellaneous', 'hatke', 'science', 'automobile'];
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
}