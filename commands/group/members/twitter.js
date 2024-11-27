const twitterGetUrl = require("twitter-url-direct");

const handler = async (sock, msg, from, args, msgInfoObj) => {

    const { sendMessageWTyping } = msgInfoObj;
    try {
        if (!args[0] || !args[0].includes("twitter.com")) return sendMessageWTyping(from, { text: `Enter the twitter link only` }, { quoted: msg });
        await twitterGetUrl(args[0]).then((res) => {
            if (res.type == 'video/gif') {
                try {
                    sendMessageWTyping(
                        from,
                        {
                            video: { url: res.download[res.download.length - 1].url.split("?tag")[0] },
                            // gifPlayback: true
                        },
                        { quoted: msg }
                    )
                } catch {
                    sendMessageWTyping(
                        from,
                        {
                            video: { url: res.download[0].url.endsWith('mp4') ? res.download[0].url : res.download[1].url },
                            // gifPlayback: true
                        },
                        { quoted: msg }
                    )
                }
            }
            if (res.type == "image") {
                sendMessageWTyping(
                    from,
                    {
                        image: { url: res.download },
                    },
                    { quoted: msg }
                )
            }
        }).catch((err) => {
            console.log(err);
            console.log(err.isAxiosError);
        })
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}

module.exports.command = () => ({
    cmd: ["twitter", "twt", "td"],
    desc: 'Download twitter media',
    usage: 'twitter <twitter link>',
    handler
});