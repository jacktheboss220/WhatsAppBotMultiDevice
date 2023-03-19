const {
    downloadContentFromMessage,
} = require("@adiwajshing/baileys");

const WSF = require("wa-sticker-formatter");
const fs = require('fs');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, type, content, sendMessageWTyping } = msgInfoObj;
    if (type === "extendedTextMessage" && content.includes("stickerMessage")) {
        // handle tagged sticker
    } else {
        return sendMessageWTyping(from, { text: `❌ *Reply on Sticker*` }, { quoted: msg });
    }

    let packName = authorName = "test";
    if (args.includes('pack')) {
        packName = args.join(' ').split('pack ')[1].split('author')[0];
    }
    if (args.includes('author')) {
        authorName = args.join(' ').split('author ')[1].split('pack')[0];
    }

    try {
        let downloadFilePath;
        downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
        const stream = await downloadContentFromMessage(downloadFilePath, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const media = getRandom('.webp');
        fs.writeFileSync(media, buffer);

        const packOrAuthor = args.includes('pack') || args.includes('author');
        const webpWithMetadata = await WSF.setMetadata(
            packOrAuthor ? packName : evv || 'myBitBot',
            packOrAuthor ? authorName : evv ? "" : 'md',
            media
        );

        await sock.sendMessage(
            from,
            { sticker: Buffer.from(webpWithMetadata) },
            { quoted: msg }
        );

        fs.unlinkSync(media);

    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}

module.exports.command = () => ({ cmd: ['steal'], handler });