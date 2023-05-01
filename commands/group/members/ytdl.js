require('dotenv').config();
const youtubedl = require('youtube-dl-exec')
const yts = require('yt-search');
const fs = require('fs')
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };


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
        let fileDown = getRandom(".mp4");
        youtubedl(search, { format: 'mp4', output: fileDown, maxFilesize: "104857600", }).then((r) => {
            console.log(typeof (r), r);
            if (r?.includes("max-filesize")) {
                return sendMessageWTyping(
                    from,
                    {
                        text: "File size exceeds more then 100MB."
                    },
                    { quoted: msg }
                )
            }
            else {
                const steam = youtubedl.exec(search, { format: "mp4", getFilename: true });
                steam.then((r) => {
                    sock.sendMessage(
                        from,
                        {
                            video: fs.readFileSync(fileDown),
                            caption: `*Title*: ${r.stdout}`
                        },
                        { quoted: msg }
                    )
                }).catch(err => {
                    sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
                })
            }
        }).catch(err => {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        })
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}