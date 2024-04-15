const fs = require('fs');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');

const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const findSongURL = async (name) => {
    const r = await yts(`${name}`);
    return r.all[0].url;
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, command, sendMessageWTyping } = msgInfoObj;

    if (!args[0]) return sendMessageWTyping(from, { text: `❌ *Enter song name*` }, { quoted: msg });
    console.log("Song:", evv);

    let URL = await findSongURL(evv);
    let fileDown = getRandom(".mp3");
    try {
        let title = (await ytdl.getInfo(URL)).videoDetails.title.trim();
        const stream = youtubedl(URL, { format: 'm4a', output: fileDown, maxFilesize: "104857600", preferFreeFormats: true, });
        await Promise.all([stream]).then(async (r) => {
            console.log(r);
            if (r?.includes("max-filesize")) {
                return sendMessageWTyping(from,
                    { text: "File size exceeds more then 100MB." },
                    { quoted: msg }
                )
            } else {
                if (fs.existsSync(fileDown)) {
                    let sock_data;
                    if (command == 'song') {
                        sock_data = {
                            document: fs.readFileSync(fileDown),
                            mimetype: "audio/mpeg",
                            fileName: title + ".mp3",
                            ppt: true,
                            caption: title,
                        }
                    } else {
                        sock_data = {
                            audio: fs.readFileSync(fileDown),
                            mimetype: "audio/mpeg",
                            fileName: fileDown,
                        }
                    }
                    await sock.sendMessage(from, sock_data, { quoted: msg });
                    fs.unlinkSync(fileDown);
                    console.log("Sent");
                } else {
                    try {
                        ytdl(URL, {
                            quality: "highestaudio"
                        }).pipe(fs.createWriteStream(fileDown)).on('finish', async () => {
                            let sock_data;
                            if (command == 'song') {
                                sock_data = {
                                    document: fs.readFileSync(fileDown),
                                    mimetype: "audio/mpeg",
                                    fileName: title + ".mp3",
                                    ppt: true,
                                }
                            } else {
                                sock_data = {
                                    audio: fs.readFileSync(fileDown),
                                    mimetype: "audio/mpeg",
                                    fileName: fileDown,
                                }
                            }
                            if (fs.existsSync(fileDown)) {
                                await sock.sendMessage(from, sock_data, { quoted: msg });
                                fs.unlinkSync(fileDown);
                                console.log("Sent");
                            } else {

                            }
                        }).on('error', (err) => {
                            console.log(err);
                            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
                        });
                    } catch (err) {
                        console.log(err);
                        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
                    }
                }
            }
        }).catch(async err => {
            console.log(err);
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });

        })
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}

module.exports.command = () => ({ cmd: ['song', 'play'], handler });
