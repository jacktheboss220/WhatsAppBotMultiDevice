const twitterGetUrl = require("twitter-url-direct");

module.exports.command = () => {
    let cmd = ["twitter", "twt", "td"]
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {

    const { sendMessageWTyping } = msgInfoObj;
    try {
        if (!args[0] || !args[0].includes("twitter.com")) return sendMessageWTyping(from, { text: `Enter the twitter link only` }, { quoted: msg });
        await twitterGetUrl(args[0]).then((res) => {
            if (res.type == 'video/gif') {
                sendMessageWTyping(
                    from,
                    {
                        // video: { url: res.download[res.download.length - 1].url.split("?tag")[0] },
                        video: { url: res.download[0].url.endsWith('mp4') ? res.download[0].url : res.download[1].url },
                        // gifPlayback: true
                    },
                    {
                        quoted: msg
                    }
                )
            }
            if (res.type == "image") {
                sendMessageWTyping(
                    from,
                    {
                        image: { url: res.download },
                    },
                    {
                        quoted: msg
                    }
                )
            }
        }).catch((err) => {
            console.log(err);
            console.log(err.isAxiosError);
        })
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: "Error try after some time" }, { quoted: msg })
    }
}