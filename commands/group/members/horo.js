const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs')

horoURL = "https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign=";
const getHoroscope = async (sign) => {
    const res = await axios.get(horoURL + sign);
    const $ = cheerio.load(res.data);
    const horoscope = $('body > div.grid.grid-right-sidebar.primis-rr > main > div.main-horoscope > p:nth-child(2)').text();
    return horoscope;
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping } = msgInfoObj;
    // const stickerGroup1 = "919557666582-1580308963@g.us";
    // if (from == stickerGroup1 ||
    // from == "918460411452-1556811704@g.us" ||
    // from == "918866770266-1608397802@g.us") {
    // const random = Math.floor(Math.random() * 10);
    // if ([1, 3, 5, 7, 9].includes(random)) {
    // return sendMessageWTyping(
    //     from,
    //     { sticker: fs.readFileSync('./media/sticker/horo-bully.webp') },
    //     { quoted: msg }
    // )
    // }
    // }
    const sections = [
        {
            title: "Categories",
            rows: [
                { title: `${prefix}horo aries`, rowId: "eva", description: "" },
                { title: `${prefix}horo taurus`, rowId: "eva", description: "" },
                { title: `${prefix}horo gemini`, rowId: "eva", description: "" },
                { title: `${prefix}horo cancer`, rowId: "eva", description: "" },
                { title: `${prefix}horo leo`, rowId: "eva", description: "" },
                { title: `${prefix}horo virgo`, rowId: "eva", description: "" },
                { title: `${prefix}horo libra`, rowId: "eva", description: "" },
                { title: `${prefix}horo scorpio`, rowId: "eva", description: "" },
                { title: `${prefix}horo sagittarius`, rowId: "eva", description: "" },
                { title: `${prefix}horo capricorn`, rowId: "eva", description: "" },
                { title: `${prefix}horo aquarius`, rowId: "eva", description: "" },
                { title: `${prefix}horo pisces`, rowId: "eva", description: "" },
            ]
        },
    ]

    const listMessage = {
        text: "Horoscope",
        footer: "Send by eva",
        buttonText: "Click here",
        viewOnce: true,
        sections
    }
    if (!args[0]) return sock.sendMessage(from, listMessage);

    let horoscope = args[0];
    let h_Low = horoscope.toLowerCase();
    const signs = {
        "aries": 1,
        "taurus": 2,
        "gemini": 3,
        "cancer": 4,
        "leo": 5,
        "virgo": 6,
        "libra": 7,
        "scorpio": 8,
        "sagittarius": 9,
        "capricorn": 10,
        "aquarius": 11,
        "pisces": 12,
    }
    // let l = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
    if (!Object.keys(signs).includes(h_Low)) {
        sendMessageWTyping(from, { text: "Kindly enter the right spelling." }, { quoted: msg });
    } else {
        getHoroscope(signs[h_Low]).then(res => {
            sendMessageWTyping(from,
                {
                    text: '*Data*: ' + new Date().toLocaleDateString() + "\n" + "*Nature Hold's For you*: " + res.split("-")[1]
                },
                { quoted: msg });
        })
        //         const options = {
        //             method: 'POST',
        //             url: 'https://aztro.sameerkumar.website/',
        //             qs: { sign: h_Low, day: 'today' }
        //         };

        //         request(options, function (error, response, body) {
        //             if (error) throw new Error(error);
        //             let callhoro = JSON.parse(body)
        //             sendMessageWTyping(
        //                 from,
        //                 {
        //                     text: `*Date*:-${callhoro.current_date}
        // *Nature Hold's For you*:-${callhoro.description}
        // *Compatibility*:-${callhoro.compatibility}
        // *Mood*:-${callhoro.mood}
        // *color*:-${callhoro.color}
        // *Lucky Number*:-${callhoro.lucky_number}
        // *Lucky time*:-${callhoro.lucky_time}`
        //                 },
        //                 { quoted: msg })
        //         });
    }
}

module.exports.command = () => ({ cmd: ['horo'], handler });