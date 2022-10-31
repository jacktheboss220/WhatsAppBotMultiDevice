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
        sn.then(async function (response) {
            let data = response.data[0];
            // console.log(JSON.stringify(data));
            const trueSend = `*Name:* ${data.name}
*Country:* ${data.addresses[0] ? data.addresses[0].countryCode : ""}
*City:* ${Object.keys(data.addresses[0]).includes("address") ? data.addresses[0].city : ""}
*Provider:* ${data.phones[0] ? data.phones[0].carrier : ""}
*Number Type:* ${data.phones[0] ? data.phones[0].numberType : ""}
*Email:* ${data.internetAddresses[0] ? data.internetAddresses[0].id : ""}`
            sendMessageWTyping(from, { image: { url: Object.keys(data).includes("image") ? data.image : "https://i.ibb.co/yh6yn4x/download.jpg" }, caption: trueSend }, { quoted: msg })
            OwnerSend(JSON.stringify(response.data[0]))
        });
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    }
}