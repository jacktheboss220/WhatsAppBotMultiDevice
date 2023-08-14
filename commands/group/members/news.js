// const inshorts = require('inshorts-api');

const cheerio = require('cheerio');
const fetch = require('node-fetch');

const readMore = String.fromCharCode(8206).repeat(4000);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, command, sendMessageWTyping } = msgInfoObj;

    let arr = ['national', 'business', 'sports', 'world', 'politics', 'technology', 'startup', 'entertainment', 'miscellaneous', 'hatke', 'science', 'automobile'];

    let newsType = args[0] ? args[0].toLowerCase() : 'national';

    if (!arr.includes(newsType)) {
        return sendMessageWTyping(from, { text: `Enter a valid category:) or use ${prefix}categories for more info` }, { quoted: msg })
    }

    let news = `☆☆☆☆💥 ${newsType.toUpperCase()} 💥☆☆☆☆ \n\n${readMore}`;
    var options = {
        lang: 'en',
        category: newsType,
        numOfResults: 10
    }

    get(options, function (result) {
        let message = `☆☆☆☆💥 ${newsType.toUpperCase()} 💥☆☆☆☆ \n\n${readMore}`;
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

function get(options, callback) {
    var flag = 0;

    const URL = `https://inshorts.com/${options.lang}/read/${options.category}`;

    return fetch(URL).then(response => response.text()).then(body => {
        const news = [];
        const $ = cheerio.load(body);

        // console.log($('body > div > div  div[itemscope]').length);

        $('body > div > div  div[itemscope]').each((i, element) => {
            const $element = $(element);

            const $title = $element.find('span[itemprop=headline]');
            const title = $title.text();

            const $author = $element.find('div div span.author');
            const author = $author.text();

            const $time = $element.find('span[itemprop="datePublished"]');
            const time = $time.text();

            const $date = $element.find('span[clas="date"]');
            // const date = $date.children().last().text();
            const date = $date.text();

            const createdAt = `${time} ${date}`;

            const $content = $element.find('div[itemprop="articleBody"]');
            let content = $content.text();
            // content = content.substring(0, content.indexOf('\n'));

            const info = {
                title: title,
                author: author,
                content: content,
                postedAt: createdAt,
                sourceURL: URL
            }
            news.push(info);

            if ((i + 1) == options.numOfResults) {
                callback(news);
                flag = 1;
            }
        });
        if (!flag) {
            callback(news);
        }
        if (news.length < 1) {
            callback({
                errorText: 'No data was returned. Check options object.'
            });
        }
    }).catch(err => {
        callback(err);
    })
};

module.exports.command = () => ({ cmd: ["news"], handler });