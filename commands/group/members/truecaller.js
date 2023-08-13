require("dotenv").config();
const truecallerjs = require('truecallerjs');

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { evv, sendMessageWTyping, ownerSend } = msgInfoObj;
    return sendMessageWTyping(from, { text: `Not Working Right Now.!!` }, { quoted: msg });
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

    const response = await truecallerjs.search(searchData);
    console.log(response.json());

    console.log(response.getName());
    console.log(response.getAlternateName());
    console.log(response.getAddresses());
    console.log(response.getEmailId());
    console.log(response.getCountryDetails());

}

module.exports.command = () => ({ cmd: ['true', 'truecaller'], handler });