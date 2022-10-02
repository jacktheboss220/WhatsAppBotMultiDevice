

module.exports.command = () => {
    let cmd = ["insta", "ig", "igd", "i"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping, ig } = msgInfoObj;
    //return sendMessageWTyping(from, { text: `Insta down for the moment, wait for update` }, { quoted: msg })
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
    ig.fetchPost(urlInsta).then((res) => {
        if (res.media_count == 1) {
            if (res.links[0].type == "video") {
                sock.sendMessage(
                    from,
                    {
                        video: { url: res.links[0].url }
                    },
                    { quoted: msg }
                )
            } else if (res.links[0].type == "image") {
                sock.sendMessage(
                    from,
                    {
                        image: { url: res.links[0].url }
                    },
                    { quoted: msg }
                )
            }
        } else if (res.media_count > 1) {
            for (let i = 0; i < res.media_count; i++) {
                if (res.links[i].type == "video") {
                    sock.sendMessage(
                        from,
                        {
                            video: { url: res.links[i].url }
                        },
                        { quoted: msg }
                    )
                } else if (res.links[i].type == "image") {
                    sock.sendMessage(
                        from,
                        {
                            image: { url: res.links[i].url }
                        },
                        { quoted: msg }
                    )
                }
            }
        }
    }).catch((err) => {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    });
}
