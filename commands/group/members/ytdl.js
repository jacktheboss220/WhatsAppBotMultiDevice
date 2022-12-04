
require('dotenv').config();
const youtubedl = require('youtube-dl-exec')
const yts = require('yt-search');
const fs = require('fs')


module.exports.command = () => {
    let cmd = ["yt", "ytv", "vs"];
    return { cmd, handler };
}
const findSong = async (sname) => {
    const r = await yts(`${sname}`)
    return r.all[0].url;
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, command, evv } = msgInfoObj;
    if (command != "vs")
        if (!args[0] || !args[0].startsWith("http")) return sendMessageWTyping(from, { text: `Enter youtube link after yt` }, { quoted: msg });
    let search;
    if (command == "vs") {
        if (!args[0]) return sendMessageWTyping(from, { text: `Enter some thing to search` }, { quoted: msg });
        search = await findSong(evv);
    } else {
        search = args[0];
    }
    try {
        youtubedl(search, { format: 'mp4' }).then(() => {
            const steam = youtubedl.exec(search, { format: "mp4", getFilename: true });
            steam.then((r) => {
                sock.sendMessage(
                    from,
                    {
                        video: fs.readFileSync(r.stdout),
                        caption: `*Title*: ${r.stdout}`
                    },
                    { quoted: msg }
                )
            }).catch(err => {
                sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            })
        }).catch(err => {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        })
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}