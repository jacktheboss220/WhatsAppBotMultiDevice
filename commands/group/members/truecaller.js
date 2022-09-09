const truecallerjs = require('truecallerjs');
module.exports.command = () => {
    let cmd = ["true", "truecaller"];
    return { cmd, handler };
}
require("dotenv").config();
const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { evv, sendMessageWTyping, OwnerSend } = msgInfoObj;
    try {
        let SearchNum;
        if (msg.message.extendedTextMessage) {
            SearchNum = msg.message.extendedTextMessage.contextInfo.participant.split("@")[0];
        }
        else {
            if (!args[0]) return sendMessageWTyping(from, { text: `❌ Give number or tag on message` }, { quoted: msg });
            if (evv.startsWith("+")) evv = evv.split("+")[1];
            if (!evv.startsWith("91")) return sendMessageWTyping(from, { text: `Only 91 can be search at the moment` }, { quoted: msg });
            SearchNum = evv;
        }
        var searchData = {
            number: SearchNum,
            countryCode: "IN",
            installationId: process.env.TRUECALLER_ID
        }

        var sn = truecallerjs.searchNumber(searchData);
        sn.then(function (response) {
            let data = response.data[0];
            const trueSend = `*Name:* ${data.name}
*Country:* ${data.addresses[0].address ? data.addresses[0].address : ""}
*City:* ${data.addresses[0].city ? data.addresses[0].city : ""}
*Provider:* ${data.phones[0].carrier ? data.phones[0].carrier : ""}
*Number Type:* ${data.phones[0].numberType ? data.phones[0].numberType : ""}
*Email:* ${data.internetAddresses[0] ? data.internetAddresses[0].id : ""}
`
            sendMessageWTyping(from, { text: trueSend }, { quoted: msg })
            OwnerSend(JSON.stringify(response.data[0]))
        });
    } catch (err) {
        sendMessageWTyping(from, { text: "Try after sometime" }, { quoted: msg })
        console.log(err);
    }
}