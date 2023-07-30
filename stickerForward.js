const { downloadMediaMessage } = require("@adiwajshing/baileys");
const WSF = require("wa-sticker-formatter");

const fs = require('fs');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const forwardGroup = "120363026740649099@g.us"; // Enter Your Group ID get by using jid command

const stickerForward = async (sock, msg, from) => {
    if (forwardGroup=="") return console.log("No Group ID is Set");

    if (from == forwardGroup) return;

    if (msg.message.extendedTextMessage) {
        msg['message'] = msg.message.extendedTextMessage.contextInfo.quotedMessage
    }

    let packName = " ⏤͟͟͞➣⃟⃟🍒𝐷Δ𝑆𝐻𝑈~ ⃟⃟⃟⃟<❤️", authorName = "";

    const media = getRandom('.webp');
    const buffer = await downloadMediaMessage(msg, 'buffer', {});
    fs.writeFileSync(media, buffer);

    try {
        const webpWithMetadata = await WSF.setMetadata(packName, authorName, media);
        await sock.sendMessage(forwardGroup, { sticker: Buffer.from(webpWithMetadata) });
        fs.unlinkSync(media);
    } catch (e) {
        const { Sticker, StickerTypes } = require("wa-sticker-formatter-1");
        const buffer = await new Sticker(media)
            .setPack(packName)
            .setAuthor(authorName)
            .setType(StickerTypes.FULL)
            .setQuality(80)
            .toBuffer();

        await sock.sendMessage(forwardGroup, { sticker: buffer });
        fs.unlinkSync(media);
    }
}

module.exports = stickerForward;
