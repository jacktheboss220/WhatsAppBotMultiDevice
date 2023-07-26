const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const {
    downloadContentFromMessage
} = require('@adiwajshing/baileys');
const { writeFile } = require('fs/promises');

const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

module.exports.command = () => {
    let cmd = ["image", "toimg"];
    return { cmd, handler };
}


const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { type, content, sendMessageWTyping } = msgInfoObj;
    const isMedia
        = type === "imageMessage" || type === "videoMessage";
    const isTaggedSticker
        = type === "extendedTextMessage" && content.includes("stickerMessage");

    if ((isMedia && !msg.message.stickerMessage.isAnimated || isTaggedSticker)) {
        let downloadFilePath;
        if (msg.message.stickerMessage) {
            downloadFilePath = msg.message.stickerMessage;
        } else {
            downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
        }
        const stream = await downloadContentFromMessage(downloadFilePath, 'sticker');
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        const media = getRandom('.webp');
        await writeFile(media, buffer);
        ffmpeg(`./${media}`)
            .fromFormat("webp_pipe")
            .save("result.png")
            .on("error", (err) => {
                console.log(err);
                sendMessageWTyping(
                    from,
                    { text: "❌ There is some problem!\nOnly non-animated stickers can be convert to image!" },
                    { quoted: msg }
                );
            })
            .on("end", () => {
                sock.sendMessage(
                    from,
                    {
                        image: fs.readFileSync("result.png"),
                        caption: 'Send by 𝙎𝘼𝘿𝙄𝙌 𝘽𝙊𝙏 🤖',
                        mimetype: 'image/png',
                    },
                    {
                        quoted: msg,
                    }
                ).then(() => {
                    try {
                        fs.unlinkSync(media)
                        fs.unlinkSync("result.png");
                    } catch { }
                })
            });
    } else {
        sendMessageWTyping(
            from,
            { text: "❌ There is some problem!\nOnly non-animated stickers can be convert to image!" },
            { quoted: msg }
        );
    }

}
