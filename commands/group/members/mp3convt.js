const { downloadMediaMessage } = require("@adiwajshing/baileys");

const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { writeFile } = require('fs/promises');

const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { type, content, sendMessageWTyping } = msgInfoObj;

    if (msg.message.extendedTextMessage) {
        msg['message'] = msg.message.extendedTextMessage.contextInfo.quotedMessage
    }

    const isMedia = type === "imageMessage" || type === "videoMessage";
    const isTaggedImage = type === "extendedTextMessage" && content.includes("imageMessage");
    const isTaggedVideo = type === "extendedTextMessage" && content.includes("videoMessage");

    if (isMedia || isTaggedImage || isTaggedVideo) {
        const media = getRandom('.mp4');
        const path = getRandom('.mp3');
        const buffer = await downloadMediaMessage(msg, 'buffer', {},);
        await writeFile(media, buffer);

        ffmpeg().input(media).audioCodec('libmp3lame').audioBitrate('320k').noVideo()
            .outputOptions(['-preset ultrafast'])
            .on('end', async () => {
                console.log('Conversion finished');
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(path),
                    mimetype: "audio/mpeg",
                    fileName: path,
                }, { quoted: msg }).then(() => {
                    try {
                        fs.unlinkSync(media);
                        fs.unlinkSync(path);
                    } catch { }
                })
            }).on('error', (err) => {
                console.error('Error:', err);
                sendMessageWTyping(from, { text: `Error while converting` }, { quoted: msg })
            }).save(path);
    }
    else {
        console.log("No Media tag");
        sendMessageWTyping(from, { text: `*Reply to video only*` }, { quoted: msg })
    }
}

module.exports.command = () => ({
    cmd: ["mp3", "mp4audio", "tomp3"],
    desc: 'Convert video to mp3',
    usage: 'mp3 | reply to video',
    handler
});