require("dotenv").config();
const truecallerjs = require('truecallerjs');

const formatMessage = (data) => {
    const name = data.name || "";
    const countryCode = data.addresses && data.addresses.length > 0 ? data.addresses[0].countryCode : "";
    const city = data.addresses && data.addresses.length > 0 ? data.addresses[0].city : "";
    const carrier = data.phones && data.phones.length > 0 ? data.phones[0].carrier : "";
    const numberType = data.phones && data.phones.length > 0 ? data.phones[0].numberType : "";
    const email = data.internetAddresses && data.internetAddresses.length > 0 ? data.internetAddresses[0].id : "";

    return `*Name:* ${name}\n*Country:* ${countryCode}\n*City:* ${city}\n*Provider:* ${carrier}\n*Number Type:* ${numberType}\n*Email:* ${email}`;
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { evv, sendMessageWTyping, ownerSend } = msgInfoObj;
    let SearchNum;
    if (msg.message.extendedTextMessage?.contextInfo?.participant?.length > 0) {
        SearchNum = msg.message.extendedTextMessage.contextInfo.participant.split("@")[0];
    }
    else if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        SearchNum = msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split("@")[0];
    }
    else {
        if (!args[0]) return sendMessageWTyping(from, { text: `❌ Give number or tag on message` }, { quoted: msg });
        if (evv.startsWith("+")) evv = evv.split("+")[1];
        if (!evv.startsWith("91")) return sendMessageWTyping(from, { text: `Only 91 can be search at the moment` }, { quoted: msg });
        SearchNum = evv.replace(/\s*/g, "");
    }
    console.log(SearchNum);
    var searchData = {
        number: SearchNum,
        countryCode: "IN",
        installationId: process.env.TRUECALLER_ID
    }

    var sn = truecallerjs.searchNumber(searchData);
    sn.then(async function (response) {
        let data = response.data[0];
        // console.log(JSON.stringify(data));
        try {
            const trueSend = formatMessage(data);
            sendMessageWTyping(
                from,
                {
                    image: {
                        url: data?.image || "https://i.ibb.co/yh6yn4x/download.jpg"
                    },
                    caption: trueSend
                },
                {
                    quoted: msg
                }
            );
            ownerSend(JSON.stringify(response.data[0], "", 2, 100));
        } catch (err) {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            console.log(err);
        }
    }
    ).catch(function (error) {
        sendMessageWTyping(from, { text: error.toString() }, { quoted: msg });
        console.log(error);
    });
}

module.exports.command = () => ({ cmd: ['true', 'truecaller'], handler });