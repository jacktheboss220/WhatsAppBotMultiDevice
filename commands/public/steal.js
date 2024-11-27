const { getMemberData } = require("../../mongo-DB/membersDataDb");
const { downloadContentFromMessage } = require("@adiwajshing/baileys");
const { Sticker, createSticker, StickerTypes } = require("wa-sticker-formatter-1");
const WSF = require("wa-sticker-formatter");

const fs = require('fs');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, type, content, sendMessageWTyping, senderJid } = msgInfoObj;
    const memberData = await getMemberData(senderJid);

    if (type === "extendedTextMessage" && content.includes("stickerMessage")) {
        let packName = authorName = "eva";
        if (args.includes('pack')) {
            packName = args.join(' ').split('pack ')[1].split('author')[0];
        }
        if (args.includes('author')) {
            authorName = args.join(' ').split('author ')[1].split('pack')[0];
        }

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

        try {
            const webpWithMetadata = await WSF.setMetadata(
                packOrAuthor ? packName : evv ? evv : memberData.customStealText || 'eva',
                packOrAuthor ? authorName : evv ? "" : memberData.customStealText ? "" : 'eva',
                media
            );

            await sock.sendMessage(from,
                { sticker: Buffer.from(webpWithMetadata) },
                { quoted: msg }
            );

            fs.unlinkSync(media);

        } catch (err) {
            // console.log(err);
            // sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            const buffer = await new Sticker(media)
                .setPack(packOrAuthor ? packName : evv ? evv : memberData.customStealText || 'eva')
                .setAuthor(packOrAuthor ? authorName : evv ? "" : memberData.customStealText ? "" : 'eva')
                .setType(StickerTypes.FULL)
                .setQuality(80)
                .toBuffer();

            await sock.sendMessage(
                from,
                { sticker: buffer },
                { quoted: msg }
            );
            fs.unlinkSync(media);
        }
    } else {
        return sendMessageWTyping(from, { text: `❌ *Reply on Sticker*` }, { quoted: msg });
    }
}

module.exports.command = () => ({
    cmd: ['steal'],
    desc: 'Steal sticker',
    usage: 'steal',
    handler
});