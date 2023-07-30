require("dotenv").config();
const trueCallerJs = require('truecallerjs');

const formatMessage = async (data) => {
    let message;
    const phone = data?.phones ? data.phones[0] : null;
    const address = data?.addresses ? data.addresses[0] : null;
    const internetAddresses = data?.internetAddresses ? data.internetAddresses[0] : null;

    const name = data?.name || "";
    const countryCode = address?.countryCode || "";
    const city = address?.city || "";
    const carrier = phone?.carrier || "";
    const numberType = phone?.numberType || "";
    const email = internetAddresses?.id || "";

    message = `*Name:* ${name}\n*Country:* ${countryCode}\n*City:* ${city}\n*Provider:* ${carrier}\n*Number Type:* ${numberType}\n*Email:* ${email}`;

    return new Promise((resolve, reject) => {
        if (message) {
            resolve(message);
        } else {
            reject("No data found");
        }
    });
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { evv, sendMessageWTyping, ownerSend } = msgInfoObj;
    let number;
    if (msg.message.extendedTextMessage?.contextInfo?.participant?.length > 0) {
        number = msg.message.extendedTextMessage.contextInfo.participant.split("@")[0];
    } else if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        number = msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split("@")[0];
    } else {
        if (!args[0]) return sendMessageWTyping(from, { text: `❌ Give number or tag on message` }, { quoted: msg });
        number = evv.replace(/\s*/g, "");
    }
    console.log(number);
    if (number.startsWith("+")) {
        number = number.split("+")[1];
    }
    if (!number.startsWith("91")) {
        return sendMessageWTyping(from, { text: `❌ Number must be start with 91` }, { quoted: msg });
    }

    var searchData = {
        number: number,
        countryCode: "IN",
        installationId: process.env.TRUECALLER_ID
    }

    trueCallerJs.searchNumber(searchData).then(async (res) => {
        let data = res.data[0];
        if (data == "null") return sendMessageWTyping(from, { text: `Rate Limit Exceeded` }, { quoted: msg });

        await formatMessage(data).then(d => {
            if (d == "No data found") {
                return sendMessageWTyping(from, { text: `❌ No data found` }, { quoted: msg });
            } else {
                sendMessageWTyping(from, {
                    image: { url: data?.image || "https://i.ibb.co/yh6yn4x/download.jpg" },
                    caption: d
                }, { quoted: msg });
            }
        });
        
        ownerSend(JSON.stringify(res, "", 2, 100));
    }).catch(function (error) {
        sendMessageWTyping(from, { text: error.toString() }, { quoted: msg });
        console.log(error);
    });
}

module.exports.command = () => ({ cmd: ['true', 'truecaller'], handler });