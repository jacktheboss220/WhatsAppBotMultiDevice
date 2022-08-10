const request = require('request-promise');
const cheerio = require('cheerio');

module.exports.command = () => {
    let cmd = ["nhoro"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;

    let horoscope = args[0];
    let h_Low = horoscope.toLowerCase();
    let l = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']

    if (!l.includes(h_Low)) {
        sendMessageWTyping(from, { text: "Kindly enter the right spelling " }, { quoted: msg })
    } else {
        request(`https://www.ganeshaspeaks.com/horoscopes/daily-horoscope/${h_Low}`, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html);
                const horo = $("#horo_content");
                sendMessageWTyping(from,
                    { text: `*Nature Hold's For you*:-${horo.text()}` },
                    { quoted: msg });
            }
        });
    }
}