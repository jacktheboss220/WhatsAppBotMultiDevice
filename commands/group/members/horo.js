const request = require('request');
const fs = require('fs')
module.exports.command = () => {
    let cmd = ["horo"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping } = msgInfoObj;
    const stickerGroup1 = "919557666582-1580308963@g.us";
    if (from == stickerGroup1 ||
        from == "918460411452-1556811704@g.us" ||
        from == "918866770266-1608397802@g.us") {
        const random = Math.floor(Math.random() * 10);
        if ([1, 3, 5, 7, 9].includes(random)) {
            return sendMessageWTyping(
                from,
                { sticker: fs.readFileSync('./media/sticker/horo-bully.webp') },
                { quoted: msg }
            )
        }
    }
    const sections = [
        {
            title: "Categories",
            rows: [
                { title: `${prefix}horo aries`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo taurus`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo gemini`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo cancer`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo leo`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo virgo`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo libra`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo scorpio`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo sagittarius`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo capricorn`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo aquarius`, rowId: "mybitbot", description: "" },
                { title: `${prefix}horo pisces`, rowId: "mybitbot", description: "" },
            ]
        },
    ]

    const listMessage = {
        text: "Horoscope",
        footer: "Send by mybitbot",
        buttonText: "Click here",
        viewOnce: true,
        sections
    }
    if (!args[0]) return sock.sendMessage(from, listMessage);

    let horoscope = args[0];
    let h_Low = horoscope.toLowerCase();
    let l = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
    if (!l.includes(h_Low)) {
        sendMessageWTyping(from, { text: "Kindly enter the right spelling." }, { quoted: msg });
    } else {
        const options = {
            method: 'POST',
            url: 'https://aztro.sameerkumar.website/',
            qs: { sign: h_Low, day: 'today' }
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            let callhoro = JSON.parse(body)
            sendMessageWTyping(
                from,
                {
                    text: `*Date*:-${callhoro.current_date}
*Nature Hold's For you*:-${callhoro.description}
*Compatibility*:-${callhoro.compatibility}
*Mood*:-${callhoro.mood}
*color*:-${callhoro.color}
*Lucky Number*:-${callhoro.lucky_number}
*Lucky time*:-${callhoro.lucky_time}`
                },
                { quoted: msg })
        });
    }
}