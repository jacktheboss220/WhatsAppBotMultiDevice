import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { downloadMediaMessage } from "baileys";
import { writeFile } from 'fs/promises';

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
            }).on("end", async () => {
                // Use sendMessageWTyping with file path for async/efficient sending
                await sendMessageWTyping(from, {
                    image: ran,
                    caption: 'Sent by eva',
                    mimetype: 'image/png',
                }, { quoted: msg });
                try {
                    fs.unlinkSync(media)
                    fs.unlinkSync(ran);
                } catch { }
            });
        } catch (err) {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            console.log(err);
        }
    }
}

export default () => ({
    cmd: ["image", "toimg"],
    desc: "Convert sticker to image",
    usage: "image | reply to a sticker",
    handler
});