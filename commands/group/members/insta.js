const { savefrom } = require('@bochilteam/scraper');

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping, ig } = msgInfoObj;

    if (args.length === 0) return sendMessageWTyping(from, { text: `❌ URL is empty! \nSend ${prefix}insta url` }, { quoted: msg });
    let urlInsta = args[0];

    if (!(urlInsta.includes("instagram.com/p/") ||
        urlInsta.includes("instagram.com/reel/") ||
        urlInsta.includes("instagram.com/tv/")))
        return sendMessageWTyping(
            from,
            { text: `❌ Wrong URL! Only Instagram posted videos, tv and reels can be downloaded.` },
            { quoted: msg }
        );

    if (urlInsta.includes("?"))
        urlInsta = urlInsta.split("/?")[0];
    console.log(urlInsta);

    try {
        savefrom(urlInsta).then(res => {
            console.log(JSON.stringify(res, null, 2, 100));
            if (res[0]?.url[0]?.type == "mp4") {
                sendMessageWTyping(from,
                    {
                        video: { url: res[0].url[0].url },
                        caption: "Send by 𝙎𝘼𝘿𝙄𝙌 𝘽𝙊𝙏 🤖"
                    },
                    { quoted: msg }
                );
            } else if (res[0]?.url[0]?.type == "webp" || res[0]?.url[0]?.type == "jpg" || res[0]?.url[0]?.type == "png" || res[0]?.url[0]?.type == "jpeg") {
                sendMessageWTyping(from,
                    {
                        image: { url: res[0].url[0].url },
                        caption: "Send by 𝙎𝘼𝘿𝙄𝙌 𝘽𝙊𝙏 🤖"
                    },
                    { quoted: msg }
                );
            }
        }).catch(err => {
            console.log(err);
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        })
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}

module.exports.command = () => ({ cmd: ["insta", "ig", "igd", "i"], handler });
