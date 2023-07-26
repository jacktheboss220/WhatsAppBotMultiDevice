// const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec')

const yts = require('yt-search');
const fs = require('fs');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const findSong = async (sname) => {
    const r = await yts(`${sname}`)
    return r.all[0].url;
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, command, sendMessageWTyping } = msgInfoObj;

    if (!args[0]) return sendMessageWTyping(from, { text: `❌ *Enter song name*` }, { quoted: msg });
    console.log("Song:", evv);

    let URL = await findSong(evv);
    let fileDown = getRandom(".m4a");
    try {
        await youtubedl(URL, { format: 'm4a', output: fileDown, maxFilesize: "104857600", }).then((r) => {
            console.log(typeof (r), r);
            if (r?.includes("max-filesize")) {
                return sendMessageWTyping(
                    from,
                    {
                        text: "File size exceeds more then 100MB."
                    },
                    { quoted: msg }
                )
            } else {
                const steam = youtubedl.exec(URL, { format: "m4a", getFilename: true });
                steam.then(async (r) => {
                    if (command == 'song') {
                        await sock.sendMessage(
                            from,
                            {
                                document: fs.readFileSync(fileDown),
                                mimetype: "audio/mpeg",
                                fileName: r.stdout,
                                ppt: true,
                            },
                            { quoted: msg }
                        )
                        fs.unlinkSync(fileDown);
                    } else {
                        await sock.sendMessage(
                            from,
                            {
                                audio: fs.readFileSync(fileDown),
                                mimetype: 'audio/mpeg',
                                fileName: fileDown,
                            },
                            { quoted: msg },
                        )
                        fs.unlinkSync(fileDown);
                        console.log("Sent");
                    }
                }).catch(err => {
                    console.error(err);
                    sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
                })
            }
        }).catch(err => {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        })
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
    // try {
    //     let title = (await ytdl.getInfo(URL)).videoDetails.title.trim();
    //     // console.log("title :", title);
    //     let sany = getRandom('.mp3')
    //     const stream = ytdl(URL, { filter: info => info.audioBitrate == 160 || info.audioBitrate == 128 })
    //         .pipe(fs.createWriteStream(sany));
    //     await new Promise((resolve, reject) => {
    //         stream.on('error', () => {
    //             console.log("Error");
    //             reject
    //         })
    //         stream.on('finish', () => {
    //             console.log("Audio downloaded");
    //             resolve
    //         })
    //     }).then(async (res) => {
    //         if (command == 'song') {
    //             await sock.sendMessage(
    //                 from,
    //                 {
    //                     document: fs.readFileSync(sany),
    //                     mimetype: "audio/mpeg",
    //                     // mimetype: 'audio/mp4',
    //                     fileName: title,
    //                     ppt: true,
    //                 },
    //                 { quoted: msg }
    //             )
    //             fs.unlinkSync(sany)

    //         } else {
    //             await sock.sendMessage(
    //                 from,
    //                 {
    //                     audio: fs.readFileSync(sany),
    //                     // mimetype: 'audio/mp4'
    //                     mimetype: "audio/mpeg",
    //                 },
    //                 { quoted: msg },
    //                 { url: title },
    //             )
    //             fs.unlinkSync(sany);
    //             console.log("Sent");
    //         }
    //     }).catch((err) => {
    //         sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    //         console.log(err);
    //     })
    // } catch (err) {
    //     console.log(err);
    //     sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    // }
}

module.exports.command = () => ({ cmd: ['song', 'play'], handler });
