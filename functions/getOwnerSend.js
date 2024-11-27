require("dotenv").config();
const myNumber = process.env.MY_NUMBER + "@s.whatsapp.net";

const ownerSend_sock = (sock, mess, msg) => {
    try {
        sock.sendMessage(myNumber, {
            text: mess,
            mentions: msg.message.extendedTextMessage
                ? msg.message.extendedTextMessage.contextInfo.mentionedJid
                : "",
        });
    } catch (e) {
        sock.sendMessage(myNumber, {
            text: mess,
        });
    }
};

module.exports = ownerSend_sock;