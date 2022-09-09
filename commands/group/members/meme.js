const fs = require('fs');
const axios = require('axios');
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };
const { delay } = require("@adiwajshing/baileys");
module.exports.command = () => {
    let cmd = ["meme"];
    return { cmd, handler };
}

let downMeme = getRandom('.mp4');
let downgif = getRandom('.gif');

const downloadmeme = async (url) => {
    const writer = fs.createWriteStream(downgif);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve("done"))
        writer.on("error", reject)
    })
    // writer.on('error', reject)
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const memeURL = 'https://meme-api.herokuapp.com/gimme';
    axios.get(`${memeURL}`).then((res) => {
        let url = res.data.url;
        if (url.includes("jpg") || url.includes("jpeg") || url.includes("png")) {
            sock.sendMessage(
                from,
                {
                    image: { url: res.data.url },
                    caption: `${res.data.title}`,
                }
            );
        } else {
            outputOptions = [
                `-movflags faststart`,
                `-pix_fmt yuv420p`,
                `-vf`,
                `scale=trunc(iw/2)*2:trunc(ih/2)*2`,
            ];
            downloadmeme(res.data.url).then(async (res1) => {
                if (res1 == 'done') {
                    ffmpeg(downgif).input(downgif).addOutputOptions(outputOptions).save(downMeme).on("end", async () => {
                        await delay(4000);
                        sock.sendMessage(
                            from,
                            {
                                video: fs.readFileSync(downMeme),
                                caption: `${res.data.title}`,
                                gifPlayback: true
                            }
                        )
                    });
                }
            })
        }
    });
}