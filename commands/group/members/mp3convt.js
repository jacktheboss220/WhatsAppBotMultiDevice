const {
    downloadContentFromMessage,
} = require("@adiwajshing/baileys");

const ffmpeg = require('fluent-ffmpeg');
const { writeFile } = require('fs/promises');
const fs = require('fs');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

module.exports.command = () => {
    let cmd = ["mp3", "mp4audio", "tomp3"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { type, content, sendMessageWTyping } = msgInfoObj;

    const isMedia
        = type === "imageMessage" || type === "videoMessage";
    const isTaggedVideo
        = type === "extendedTextMessage" && content.includes("videoMessage");

    if ((isMedia && !msg.message.imageMessage || isTaggedVideo)) {
        let downloadFilePath;
        if (msg.message.videoMessage) {
            downloadFilePath = msg.message.videoMessage;
        } else {
            downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage;
        }
        const stream = await downloadContentFromMessage(downloadFilePath, 'video');
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        const media = getRandom('.mp4')
        await writeFile(media, buffer)
        const path = getRandom('.mp3')
        function convert(input, output, callback) {
            ffmpeg(input)
                .output(output)
                .on('end', function () {
                    console.log('conversion ended');
                    callback(null);
                }).on('error', function (err) {
                    console.log('error: ', e.code, e.msg);
                    callback(err);
                }).run();
        }
        convert(media, path, function (err) {
            if (!err) {
                console.log('conversion complete');
                (async () => {
                    await sock.sendMessage(
                        from,
                        {
                            audio: fs.readFileSync(path),
                            mimetype: 'audio/mp4'
                        },
                        { quoted: msg }
                    ).then(() => {

                        try {
                            fs.unlinkSync(media);
                            fs.unlinkSync(path);
                        } catch { }
                    })
                })();
            } else {
                sendMessageWTyping(from, { text: `Error while converting` }, { quoted: msg })
            }
        });
    }
    else {
        console.log("No Media tag");
        sendMessageWTyping(from, { text: `*Reply to video only*` }, { quoted: msg })
    }
}