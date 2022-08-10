
require('dotenv').config();
const { YouTube } = require('../../../social-downloader-sdk');

module.exports.command = () => {
    let cmd = ["yt", "ytv"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;

    if (!args[0] || !args[0].startsWith("http")) return sendMessageWTyping(from, { text: `Enter youtube link after yt` }, { quoted: msg });

    try {
        const resV = await YouTube.getVideo(args[0]);
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
    } catch {
        sendMessageWTyping(from, { text: 'Error' }, { quoted: msg })
    }
}