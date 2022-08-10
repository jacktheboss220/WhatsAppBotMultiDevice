const fs = require('fs');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg')();
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

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
        writer.on('finish', resolve)
        writer.on('error', reject)
    });
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
            downloadmeme(res.data.url).then(() => {
                ffmpeg.input(downgif).noAudio().output(downMeme).on("end", () => {
                    console.log("Finished");
                    sock.sendMessage(
                        from,
                        {
                            video: fs.readFileSync(downgif),
                            caption: `${res.data.title}`,
                            gifPlayback: true
                        }
                    )
                }).on("error", (e) => console.log(e)).run();
            });
        }
    });
}