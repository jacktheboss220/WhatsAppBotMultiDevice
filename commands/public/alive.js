const fs = require('fs');
module.exports.command = () => {
    let cmd = ["alive", "a"];
    return { cmd, handler };
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    // const buttons = [
    //     { buttonId: 'mybitbot', buttonText: { displayText: 'Help' }, type: 1 },
    // ]

    // const buttonMessage = {
    //     image: fs.readFileSync(__dirname + "/../../media/alive-img.jpg"),
    //     // text: "```Yes Bot is Running...```❣️",
    //     caption: "```Yes Bot is Running...```❣️",
    //     footer: 'mybitbot',
    //     buttons: buttons,
    //     viewOnce: true,
    //     headerType: 4
    // }

    // await sock.sendMessage(
    //     from,
    //     buttonMessage,
    // )

    await sendMessageWTyping(
        from,
        { text: "```Error: Eva not detected. Press any key to continue...```❣️" },
        { quoted: msg }
        // {
        //     quoted: {
        //         key: {
        //             remoteJid: from,
        //             fromMe: false,
        //             id: "810B5GH29EE7481fakeid",
        //             participant: "0@s.whatsapp.net",
        //         },
        //         messageTimestamp: 1122334455,
        //         pushName: "WhatsApp",
        //         message: { conversation: "jacktheboss220" },
        //     },
        // }
    );
};