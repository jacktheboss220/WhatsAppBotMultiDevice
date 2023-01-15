const ytdl = require('ytdl-core');
const yts = require('yt-search');
const fs = require('fs');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

module.exports.command = () => {
    let cmd = ["song", "play"];
    return { cmd, handler };
}


const findSong = async (sname) => {
    const r = await yts(`${sname}`)
    return r.all[0].url;
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, command, sendMessageWTyping } = msgInfoObj;

    if (!args[0]) return sendMessageWTyping(from, { text: `❌ *Enter song name*` }, { quoted: msg });
    console.log("Song: ", evv);

    let URL = await findSong(evv);
    (async () => {
        try {
            let title = (await ytdl.getInfo(URL)).videoDetails.title.trim();
            // console.log("title :", title);
            let sany = getRandom('.mp3')
            const stream = ytdl(URL, { filter: info => info.audioBitrate == 160 || info.audioBitrate == 128 })
                .pipe(fs.createWriteStream(sany));
            console.log("Audio downloaded")
            await new Promise((resolve, reject) => {
                stream.on('error', reject)
                stream.on('finish', resolve)
            }).then(async (res) => {
                if (command == 'song') {
                    await sock.sendMessage(
                        from,
                        {
                            document: fs.readFileSync(sany),
                            mimetype: 'audio/mp4',
                            fileName: title,
                            ppt: true,
                        },
                        { quoted: msg }
                    ).then(() => {
                        console.log("Sent");
                        try {
                            fs.unlinkSync(sany)
                        } catch { }
                    })
                } else {
                    await sendMessageWTyping(
                        from,
                        {
                            audio: fs.readFileSync(sany),
                            // mimetype: 'audio/mp4'
                        },
                        { quoted: msg },
                        { url: sany },
                    ).then(() => {
                        console.log("Sent");
                        try {
                            // fs.unlinkSync(sany)
                        } catch { }
                    })
                }
            }).catch((err) => {
                sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
                console.log(err);
            })
        } catch (err) {
            console.log(err);
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        }
    })();
}