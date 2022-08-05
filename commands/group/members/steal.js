require('dotenv').config();

const {
    downloadContentFromMessage,
} = require("@adiwajshing/baileys");
//--------------STICKER MODULE------------------------------------------//
const WSF = require("wa-sticker-formatter");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
//-------------------------------------------------------------------------//
const fs = require('fs');
const { writeFile } = require('fs/promises');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

module.exports.command = () => {
    let cmd = ["steal"];
    return { cmd, handler };
}


const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, type, content, sendMessageWTyping } = msgInfoObj;
    const isTaggedSticker
        = type === "extendedTextMessage" && content.includes("stickerMessage");
    if (!isTaggedSticker) return sendMessageWTyping(from, { text: `❌ *Reply on Sticker*` }, { quoted: msg });

    try {
        var packName = ""
        var authorName = ""
        if (args.includes('pack') == true) {
            packNameDataCollection = false;
            for (let i = 0; i < args.length; i++) {
                if (args[i].includes('pack') == true) {
                    packNameDataCollection = true;
                }
                if (args[i].includes('author') == true) {
                    packNameDataCollection = false;
                }
                if (packNameDataCollection == true) {
                    packName = packName + args[i] + ' '
                }
            }
            if (packName.startsWith('pack ')) {
                packName = `${packName.split('pack ')[1]}`
            }
        }
        if (args.includes('author') == true) {
            authorNameDataCollection = false;
            for (let i = 0; i < args.length; i++) {
                if (args[i].includes('author') == true) {
                    authorNameDataCollection = true;
                }
                if (authorNameDataCollection == true) {
                    authorName = authorName + args[i] + ' '
                }
                if (authorName.startsWith('author ')) {
                    authorName = `${authorName.split('author ')[1]}`
                }
            }
        }
        if (packName == "") {
            packName = "myBitBot"
        }
        if (authorName == "") {
            authorName = "md"
        }

        let downloadFilePath;
        downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
        const stream = await downloadContentFromMessage(downloadFilePath, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const media = getRandom('.webp');
        await writeFile(media, buffer).then(async () => {
            if ((args.includes('author') == false || args.includes('pack') == false) && args.length != 0) {
                await WSF.setMetadata(
                    evv,
                    '',
                    media
                ).then(() => {
                    sock.sendMessage(
                        from,
                        { sticker: fs.readFileSync(media) }
                    ).then(() => {
                        try {
                            fs.unlinkSync(media);
                        } catch { }
                    })
                });
            } else if ((args.includes('author') == true || args.includes('pack') == true) || args.length == 0) {
                await WSF.setMetadata(
                    packName,
                    authorName,
                    media
                ).then(() => {
                    sock.sendMessage(
                        from,
                        { sticker: fs.readFileSync(media) }
                    ).then(() => {
                        try {
                            fs.unlinkSync(media);
                        } catch { }
                    })
                });
            }
        });
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: "Error." }, { quoted: msg });
    }
}