const fs = require('fs');
const axios = require('axios');

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const { delay } = require("baileys");

let down_meme = getRandom('.mp4');
let down_gif = getRandom('.gif');

const downloadMedia = async (url) => {
    const writer = fs.createWriteStream(down_gif);
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
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const memeURL = 'https://meme-api.com/gimme';
    await axios.get(`${memeURL}`).then((res) => {
        let url = res.data.url;
        if (url.includes("jpg") || url.includes("jpeg") || url.includes("png")) {
            sock.sendMessage(from,
                { image: { url: res.data.url }, caption: `${res.data.title}` }
            );
        } else {
            outputOptions = [
                `-movflags faststart`, `-pix_fmt yuv420p`, `-vf`,
                `scale=trunc(iw/2)*2:trunc(ih/2)*2`,
            ];
            downloadMedia(res.data.url).then(async (res1) => {
                if (res1 == 'done') {
                    ffmpeg(down_gif).input(down_gif).addOutputOptions(outputOptions).save(down_meme).on("end", async () => {
                        await delay(4000);
                        sock.sendMessage(from, {
                            video: fs.readFileSync(down_meme),
                            caption: `${res.data.title}`,
                            gifPlayback: true
                        })
                    });
                }
            })
        }
    });
}

module.exports.command = () => ({
    cmd: ["meme"],
    desc: "Get random meme",
    usage: "meme",
    handler
});