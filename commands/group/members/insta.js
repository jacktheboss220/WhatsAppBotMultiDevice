const snapsave = require("insta-downloader");

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping, ig } = msgInfoObj;

    if (args.length === 0) return sendMessageWTyping(from, { text: `❎ URL is empty! \nSend ${prefix}insta url` }, { quoted: msg });
    let urlInsta = args[0];

    if (!(urlInsta.includes("instagram.com/p/") ||
        urlInsta.includes("instagram.com/reel/") ||
        urlInsta.includes("instagram.com/tv/")))
        return sendMessageWTyping(from,
            { text: `❎ Wrong URL! Only Instagram posted videos, tv and reels can be downloaded.` },
            { quoted: msg }
        );

    if (urlInsta.includes("?")) urlInsta = urlInsta.split("/?")[0];
    console.log(urlInsta);

    // ig.fetchPost(urlInsta).then(async (res) => {
    //     if (res.media_count == 1) {
    //         if (res.links[0].type == "video") {
    //             sock.sendMessage(from,
    //                 { video: { url: res.links[0].url } },
    //                 { quoted: msg }
    //             )
    //         } else if (res.links[0].type == "image") {
    //             sock.sendMessage(from,
    //                 { image: { url: res.links[0].url } },
    //                 { quoted: msg }
    //             )
    //         }
    //     } else if (res.media_count > 1) {
    //         for (let i = 0; i < res.media_count; i++) {
    //             await new Promise((resolve) => setTimeout(resolve, 500));
    //             if (res.links[i].type == "video") {
    //                 sock.sendMessage(from,
    //                     { video: { url: res.links[i].url } },
    //                     { quoted: msg }
    //                 )
    //             } else if (res.links[i].type == "image") {
    //                 sock.sendMessage(from,
    //                     { image: { url: res.links[i].url } },
    //                     { quoted: msg }
    //                 )
    //             }
    //         }
    //     }
    // }).catch(() => {
    snapsave(urlInsta).then(async res => {
        // console.log(res);
        if (res.status) {
            const data = [...new Set(res.data.map(item => item.url))];
            for (let i = 0; i < data.length; i++) {
                // await new Promise((resolve) => setTimeout(resolve, 500));
                setTimeout(() => {
                    const url = data[i];
                    if (url.includes("jpg") || url.includes("png") || url.includes("jpeg") || url.includes("webp")) {
                        sock.sendMessage(from,
                            { image: { url: url } },
                            { quoted: msg }
                        );
                    } else {
                        sock.sendMessage(from,
                            { video: { url: url } },
                            { quoted: msg }
                        );
                    }
                }, 1000 * 1);
            }
        } else {
            sendMessageWTyping(from, { text: "No Data Found!!" }, { quoted: msg });
        }
    })
    // });
}

module.exports.command = () => ({ cmd: ["insta", "i"], handler });