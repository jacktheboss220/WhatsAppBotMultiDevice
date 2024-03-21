const { downloadMediaMessage } = require("@adiwajshing/baileys");
const WSF = require("wa-sticker-formatter");

const fs = require('fs');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const forwardGroup = "120363040592884772@g.us"; // Group ID

const ignoreGroup = ["120363180984721796@g.us","120363176174874046@g.us"," 120363195820842190@g.us"]; // Group ID with commas

const stickerLengthArray = [];

const stickerForward = async (sock, msg, from) => {
    if (!forwardGroup || ignoreGroup.includes(from) || from === forwardGroup) return;

    if (msg.message.extendedTextMessage) {
        msg['message'] = msg.message.extendedTextMessage.contextInfo.quotedMessage
    }

    let packName = "ｄａｓｈｕ<3❤️", authorName = "";

    const media = getRandom('.webp');
    const buffer = await downloadMediaMessage(msg, 'buffer', {});
    fs.writeFileSync(media, buffer);

    fs.stat(media, async (err, stats) => {
        if (err) return;
        const fileSizeInBytes = stats.size;
        const fileSizeInKB = fileSizeInBytes / 1024;
        const fileSizeInMB = fileSizeInKB / 1024;
        if (stickerLengthArray.length > 5) stickerLengthArray.shift();
        if (stickerLengthArray.includes(fileSizeInMB)) return fs.unlinkSync(media);
        else {
            try {
                const webpWithMetadata = await WSF.setMetadata(packName, authorName, media);
                await sock.sendMessage(forwardGroup, { sticker: Buffer.from(webpWithMetadata) });
                fs.unlinkSync(media);
            } catch (e) {
                const { Sticker, StickerTypes } = require("wa-sticker-formatter-1");
                const sticker_buffer = await new Sticker(media)
                    .setPack(packName)
                    .setAuthor(authorName)
                    .setType(StickerTypes.FULL)
                    .setQuality(80)
                    .toBuffer();

                await sock.sendMessage(forwardGroup, { sticker: sticker_buffer });
                fs.unlinkSync(media);
            }
            stickerLengthArray.push(fileSizeInMB);
        }
    });
}

module.exports = { stickerForward, forwardGroup };
