const ytdl = require('ytdl-core');
const yts = require('yt-search');
const fs = require('fs');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

module.exports.command = () => {
    let cmd = ["yta"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, command, sendMessageWTyping } = msgInfoObj;

    if (!args[0]) return sendMessageWTyping(from, { text: `❎ *Enter Youtube link*` }, { quoted: msg });

    (async () => {
        try {
            let sany = getRandom('.mp3');
            const stream = ytdl(args[0], { filter: info => info.audioBitrate == 160 || info.audioBitrate == 128 })
                .pipe(fs.createWriteStream(sany));
            console.log("Audio downloaded")
            await new Promise((resolve, reject) => {
                stream.on('error', reject)
                stream.on('finish', resolve)
            }).then(async (res) => {
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(sany),
                }, { quoted: msg }).then(() => {
                    console.log("Sent");
                    try {
                        fs.unlinkSync(sany)
                    } catch { }
                })
            }).catch((err) => {
                console.log(err);
            })
        } catch (err) {
            console.log(err);
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        }
    })();
}