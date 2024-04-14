const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { downloadMediaMessage } = require("@adiwajshing/baileys");
const { writeFile } = require('fs/promises');

const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { type, content, sendMessageWTyping } = msgInfoObj;

    if (msg.message.extendedTextMessage) {
        msg['message'] = msg.message.extendedTextMessage.contextInfo.quotedMessage
    }

    const isMedia = type === "imageMessage" || type === "videoMessage";
    const isTaggedSticker = type === "extendedTextMessage" && content.includes("stickerMessage");

    const media = getRandom('.webp');

    if (isMedia || isTaggedSticker) {
        if (msg.message?.videoMessage?.seconds > 11) {
            return sendMessageWTyping(from,
                { text: "Send less then 11 seconds." },
                { quoted: msg })
        }
        const buffer = await downloadMediaMessage(msg, 'buffer', {},);
        await writeFile(media, buffer);
        await sendImage(media);
    } else {
        sendMessageWTyping(from, { text: `❎ *Reply to sticker only*` }, { quoted: msg });
        console.error('Error not replied');
    }
    async function sendImage(media) {
        const ran = getRandom('.png');
        try {
            const file = ffmpeg(`./${media}`).fromFormat("webp_pipe").save(ran);
            file.on("error", (err) => {
                console.log(err);
                sendMessageWTyping(from,
                    { text: "❎ There is some problem!\nOnly non-animated stickers can be convert to image!" },
                    { quoted: msg });
            }).on("end", () => {
                sock.sendMessage(from, {
                    image: fs.readFileSync(ran),
                    caption: 'Sent by eva',
                    mimetype: 'image/png',
                }, { quoted: msg }).then(() => {
                    try {
                        fs.unlinkSync(media)
                        fs.unlinkSync(ran);
                    } catch { }
                })
            });
        } catch (err) {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            console.log(err);
        }
    }
}

module.exports.command = () => ({ cmd: ["image", "toimg"], handler });