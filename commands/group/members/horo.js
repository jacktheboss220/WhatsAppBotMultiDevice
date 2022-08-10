const axios = require('axios');
module.exports.command = () => {
    let cmd = ["horo"];
    return { cmd, handler };
}


async function gethoro(sunsign) {
    var mainconfig = {
        method: 'POST',
        url: `https://aztro.sameerkumar.website/?sign=${sunsign}&day=today`
    }
    let horo;
    await axios.request(mainconfig).then((res) => {
        horo = res.data
    }).catch((error) => {
        return false;
    })
    return horo;
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping } = msgInfoObj;
    const sections = [
        {
            title: "Categories",
            rows: [
                { title: `${prefix}horo aries`, rowId: "option1", description: "" },
                { title: `${prefix}horo taurus`, rowId: "option2", description: "" },
                { title: `${prefix}horo gemini`, rowId: "option3", description: "" },
                { title: `${prefix}horo cancer`, rowId: "option4", description: "" },
                { title: `${prefix}horo leo`, rowId: "option5", description: "" },
                { title: `${prefix}horo virgo`, rowId: "option6", description: "" },
                { title: `${prefix}horo libra`, rowId: "option7", description: "" },
                { title: `${prefix}horo scorpio`, rowId: "option8", description: "" },
                { title: `${prefix}horo sagittarius`, rowId: "option9", description: "" },
                { title: `${prefix}horo capricorn`, rowId: "option10", description: "" },
                { title: `${prefix}horo aquarius`, rowId: "option11", description: "" },
                { title: `${prefix}horo pisces`, rowId: "option12", description: "" },
            ]
        },
    ]

    const listMessage = {
        text: "Horoscope",
        footer: "Send by mybitbot",
        buttonText: "Click here",
        sections
    }
    if (!args[0]) return sock.sendMessage(from, listMessage);

    let horoscope = args[0];
    let h_Low = horoscope.toLowerCase();
    let l = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
    if (!l.includes(h_Low)) {
        sendMessageWTyping(from, { text: "Kindly enter the right spelling." }, { quoted: msg });
    } else {
        const callhoro = await gethoro(h_Low);
        console.log("horo", args[0]);
        sendMessageWTyping(
            from,
            {
                text: `*Date Range*:-${callhoro.date_range}
*Nature Hold's For you*:-${callhoro.description}
*Compatibility*:-${callhoro.compatibility}
*Mood*:-${callhoro.mood}
*color*:-${callhoro.color}
*Lucky Number*:-${callhoro.lucky_number}
*Lucky time*:-${callhoro.lucky_time}`
            },
            { quoted: msg }
        );
    }
}