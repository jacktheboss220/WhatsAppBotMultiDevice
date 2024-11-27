const fs = require('fs');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec');

const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const findVideoURL = async (name) => {
    const r = await yts(`${name}`)
    return r.all[0].url + '&bpctr=9999999999&has_verified=1';
}

const jsonCookie = fs.readFileSync('./www.youtube.com_cookies.json', 'utf8');
const COOKIE = JSON.parse(jsonCookie).map(r => `${r.name}=${r.value}`).join("; ");
const x_youtube_identity_token = `QUFFLUhqbHhVazkzOE5mVjlpWDdnLTF4R0Y1bk4wQTdZQXw\\u003d`;

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
    let fileDown = getRandom(".mp4");
    try {
        let title = await ytdl.getInfo(URL, {
            format: 'mp4',
            maxFilesize: "104857600",
            requestOptions: {
                headers: {
                    cookie: COOKIE,
                    'x-youtube-identity-token': x_youtube_identity_token
                }
            }
        }).then(res => res.videoDetails.title.trim());
        console.log("Title:", title);
        const stream = await youtubedl(URL, {
            format: 'bestvideo+bestaudio+mp4',
            maxFilesize: "104857600",
            output: fileDown,
            addHeader: [`cookie: ${COOKIE}`],
        })
        await Promise.all([stream]).then(async (r) => {
            console.log(r);
            if (r?.includes("max-filesize")) {
                return sendMessageWTyping(from,
                    { text: "File size exceeds more then 100MB." },
                    { quoted: msg }
                );
            } else {
                if (fs.existsSync(fileDown)) {
                    await sock.sendMessage(from, {
                        video: fs.readFileSync(fileDown),
                        caption: `*Title*: ${title}`,
                        mimetype: "video/mp4",
                    }, { quoted: msg });
                    fs.unlinkSync(fileDown);
                } else {
                    try {
                        ytdl(URL, {
                            // filter: info => info.hasVideo && info.hasAudio,
                            filter: format => format.container === 'mp4',
                            // format: 'mp4',
                            maxFilesize: "104857600",
                            requestOptions: {
                                headers: {
                                    cookie: COOKIE,
                                    'x-youtube-identity-token': x_youtube_identity_token
                                }
                            }
                        }).pipe(fs.createWriteStream(fileDown)).on('finish', async () => {
                            await sock.sendMessage(from, {
                                video: fs.readFileSync(fileDown),
                                caption: `*Title*: ${title}`,
                                mimetype: "video/mp4",
                            }, { quoted: msg });
                            fs.unlinkSync(fileDown);
                        }).on('error', (err) => {
                            console.log(err);
                            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
                        });
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
        }).catch(async err => {
            console.log(err);
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });

        })
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}

module.exports.command = () => ({
    cmd: ["yt", "ytv", "vs"],
    desc: 'Download youtube video',
    usage: 'yt <youtube link>',
    handler
});