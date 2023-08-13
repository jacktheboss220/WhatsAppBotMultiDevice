const fs = require('fs');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');

const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const findVideoURL = async (name) => {
    const r = await yts(`${name}`)
    return r.all[0].url;
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, command, evv } = msgInfoObj;
    if (command != "vs")
        if (!args[0] || !args[0].startsWith("http")) return sendMessageWTyping(from, { text: `Enter youtube link after yt` }, { quoted: msg });
    let URL;
    if (command == "vs") {
        if (!args[0]) return sendMessageWTyping(from, { text: `Enter some thing to search` }, { quoted: msg });
        URL = await findVideoURL(evv);
    } else {
        URL = args[0];
    }
    try {
        let fileDown = getRandom(".mp4");
        let title = (await ytdl.getInfo(URL)).videoDetails.title.trim();
        youtubedl(URL, { format: 'mp4', output: fileDown, maxFilesize: "104857600" }).then((r) => {
            console.log(r);
            if (r?.includes("max-filesize")) {
                return sendMessageWTyping(from,
                    { text: "File size exceeds more then 100MB." },
                    { quoted: msg }
                );
            } else {
                sock.sendMessage(from, {
                    video: fs.readFileSync(fileDown),
                    caption: `*Title*: ${title}`,
                    mimetype: "video/mp4",
                }, { quoted: msg });
            }
        }).catch(err => {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        })
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}

module.exports.command = () => ({ cmd: ["yt", "ytv", "vs"], handler });