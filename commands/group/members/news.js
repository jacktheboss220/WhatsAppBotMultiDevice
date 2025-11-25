import inshorts from 'inshorts-api';
const readMore = String.fromCharCode(8206).repeat(4000);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, command, sendMessageWTyping } = msgInfoObj;

    let arr = ['national', 'business', 'sports', 'world', 'politics', 'technology', 'startup', 'entertainment', 'miscellaneous', 'hatke', 'science', 'automobile'];

    if (command == "categories") {
        return sendMessageWTyping(from, {
            text: arr.map((e, i) => `${i + 1}. ${e}`).join("\n"),
        }, { quoted: msg });
    }

    let newsType = args[0] || '';

    if (!arr.includes(newsType) && newsType != "") {
        return sendMessageWTyping(from, { text: `Enter a valid category :) or use ${prefix}categories for more info` }, { quoted: msg })
    }

    var options = {
        lang: 'en',
        category: newsType,
        numOfResults: 10
    }

    inshorts.get(options, function (result) {
        let message = `☆☆☆☆💥 ${newsType == "" ? "All" : newsType.toUpperCase()} 💥☆☆☆☆ \n\n${readMore}`;
        for (const news of result) {
            message += '🌐 ';
            message += `${news.title} ~ ${news.author}\n`;
            // message += `Author: ${news.author}\n`;
            // message += `Content: ${news.content}\n`;
            // message += `Posted At: ${news.postedAt}\n`;
            // message += `Source URL: ${news.sourceURL}\n`;
            message += '\n';
        }
        sendMessageWTyping(from, { text: message });
    });
}

export default () => ({
    cmd: ["news", "categories"],
    desc: "Get news",
    usage: "news | news <category> | categories",
    handler
});