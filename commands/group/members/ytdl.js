
require('dotenv').config();
const { YouTube } = require('../../../social-downloader-sdk');
const yts = require('yt-search');


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
        await YouTube.getVideo(search).then(resV => {
            let YTtitle = resV.data.body.meta.title;
            let found = false, k;
            for (let i = 0; i < resV.data.body.url.length; i++) {
                if (
                    resV.data.body.url[i].quality == 720
                    && resV.data.body.url[i].no_audio == false
                ) {
                    found = true;
                    return sock.sendMessage(
                        from,
                        {
                            video: { url: resV.data.body.url[i].url },
                            caption: `*Title*: ${YTtitle}
*Quality*: 720p`
                        },
                        { quoted: msg }
                    )
                } else if
                    (
                    resV.data.body.url[i].quality == 360
                    && resV.data.body.url[i].no_audio == false
                ) {
                    if (found == false) {
                        k = i;
                    }
                }
            }
            if (found == false) {
                sock.sendMessage(
                    from,
                    {
                        video: { url: resV.data.body.url[k].url },
                        caption: `*Title*: ${YTtitle}
*Quality*: 360p`
                    },
                    { quoted: msg }
                )
            }
        }).catch(err => {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        });
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}