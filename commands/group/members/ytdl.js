const fs = require('fs');
const yts = require('yt-search');
// const ytdl = require('ytdl-core');
// const youtubedl = require('youtube-dl-exec');

//-------------------------------------------------------------------------------------------------------------//

const cp = require('child_process');
const readline = require('readline');
// External modules
const ffmpeg = require('ffmpeg-static');
// Global constants
const ytdl = require("@distube/ytdl-core");

const agent = ytdl.createAgent(JSON.parse(fs.readFileSync("cookies.json")));


const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const findVideoURL = async (name) => {
    const r = await yts(`${name}`)
    return r.all[0].url + '&bpctr=9999999999&has_verified=1';
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, command, evv } = msgInfoObj;
    if (command != "vs")
        if (!args[0] || !args[0].startsWith("http")) return sendMessageWTyping(from, { text: `Enter youtube link after yt` }, { quoted: msg });
    let URL = args[0];
    if (command == "vs") {
        if (!args[0]) return sendMessageWTyping(from, { text: `Enter some thing to search` }, { quoted: msg });
        URL = await findVideoURL(evv);
    } else {
        URL = args[0];
    }
    let fileDown = getRandom(".mp4");
    try {

        let title = await ytdl.getBasicInfo(URL).then(info => info.videoDetails.title, { agent });
        // let title = await ytdl.getBasicInfo(URL).then(info => info.videoDetails.title);

        console.log(title, URL);

        const tracker = {
            start: Date.now(),
            audio: { downloaded: 0, total: Infinity },
            video: { downloaded: 0, total: Infinity },
            merged: { frame: 0, speed: '0x', fps: 0 },
        };

        // Get audio and video streams
        const audio = ytdl(URL, {
            agent,
            quality: 'highestaudio',
        })
            .on('progress', (_, downloaded, total) => {
                tracker.audio = { downloaded, total };
            })

            .on('error', (err) => {
                console.log(err);
            });

        const video = ytdl(URL, {
            agent,
            quality: 'highestvideo',
        })
            .on('progress', (_, downloaded, total) => {
                tracker.video = { downloaded, total };
            })

            .on('error', (err) => {
                console.log(err);
            });

        // Prepare the progress bar
        let progressBarHandle = null;
        const progressBarInterval = 1000;

        const showProgress = () => {
            readline.cursorTo(process.stdout, 0);
            const toMB = i => (i / 1024 / 1024).toFixed(2);
            console.log("ToMB:", toMB(tracker.audio.downloaded), toMB(tracker.audio.total));

            process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
            process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

            process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
            process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

            process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
            process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

            process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
            readline.moveCursor(process.stdout, 0, -3);
        };

        // Start the ffmpeg child process
        const ffmpegProcess = cp.spawn(ffmpeg, [
            // Remove ffmpeg's console spamming
            '-loglevel', '8', '-hide_banner',
            // Redirect/Enable progress messages
            '-progress', 'pipe:3',
            // Set inputs
            '-i', 'pipe:4',
            '-i', 'pipe:5',
            // Map audio & video from streams
            '-map', '0:a',
            '-map', '1:v',
            // Keep encoding
            '-c:v', 'copy',
            // Define output file
            fileDown
        ], {
            windowsHide: true,
            stdio: [
                /* Standard: stdin, stdout, stderr */
                'inherit', 'inherit', 'inherit',
                /* Custom: pipe:3, pipe:4, pipe:5 */
                'pipe', 'pipe', 'pipe',
            ],
        });

        ffmpegProcess.on('close', async () => {
            console.log('done');
            // Cleanup
            process.stdout.write('\n\n\n\n');
            clearInterval(progressBarHandle);

            await sock.sendMessage(from, {
                video: fs.readFileSync(fileDown),
                caption: `*Title*: ${title}`,
                // mimetype: "video/mp4",
            }, { quoted: msg });
            fs.unlinkSync(fileDown);
        });

        ffmpegProcess.on('error', (err) => {
            console.error('FFmpeg error:', err);
        });

        // Link streams
        // FFmpeg creates the transformer streams and we just have to insert / read data

        ffmpegProcess.stdio[3].on('data', chunk => {
            // Start the progress bar
            if (!progressBarHandle) progressBarHandle = setInterval(showProgress, progressBarInterval);
            // Parse the param=value list returned by ffmpeg
            const lines = chunk.toString().trim().split('\n');
            const args = {};
            for (const l of lines) {
                const [key, value] = l.split('=');
                args[key.trim()] = value.trim();
            }
            tracker.merged = args;
        });

        audio.pipe(ffmpegProcess.stdio[4]);
        video.pipe(ffmpegProcess.stdio[5]);

        // let title = await ytdl.getInfo(URL, {
        //     format: 'mp4',
        //     maxFilesize: "104857600",
        //     requestOptions: {
        //         headers: {
        //             cookie: COOKIE,
        //             'x-youtube-identity-token': x_youtube_identity_token
        //         }
        //     }
        // }).then(res => res.videoDetails.title.trim());

        // let title = await ytdl.getBasicInfo(URL).then(info => info.videoDetails.title);
        // console.log("Title:", title);

        // const stream = await youtubedl(URL, {
        //     // format: 'bestvideo+bestaudio+mp4',
        //     format: 'mp4',
        //     maxFilesize: "104857600",
        //     output: fileDown,
        //     // addHeader: [`cookie: ${COOKIE}`],
        // });

        // await Promise.all([stream]).then(async (r) => {
        //     console.log(r);
        //     if (r?.includes("max-filesize")) {
        //         return sendMessageWTyping(from,
        //             { text: "File size exceeds more then 100MB." },
        //             { quoted: msg }
        //         );
        //     } else {
        //         if (fs.existsSync(fileDown)) {
        //             await sock.sendMessage(from, {
        //                 video: fs.readFileSync(fileDown),
        //                 caption: `*Title*: ${title}`,
        //                 mimetype: "video/mp4",
        //             }, { quoted: msg });
        //             fs.unlinkSync(fileDown);
        //         } else {
        //             try {
        //                 ytdl(URL, {
        //                     filter: info => info.hasVideo && info.hasAudio,
        //                     filter: format => format.container === 'mp4',
        //                     format: 'videoandaudio',
        //                     maxFilesize: "104857600",
        //                     quality: 'highest',
        //                     requestOptions: {
        //                         headers: {
        //                             cookie: COOKIE,
        //                             'x-youtube-identity-token': x_youtube_identity_token
        //                         }
        //                     }
        //                 }).pipe(fs.createWriteStream(fileDown)).on('finish', async () => {
        //                     await sock.sendMessage(from, {
        //                         video: fs.readFileSync(fileDown),
        //                         caption: `*Title*: ${title}`,
        //                         mimetype: "video/mp4",
        //                         // gifPlayback: true,
        //                     }, { quoted: msg });
        //                     fs.unlinkSync(fileDown);
        //                 }).on('error', async (err) => {
        //                     console.log(err);
        //                     // sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        //                 });
        //             } catch (err) {
        //                 console.log(err);
        //             }
        //         }
        //     }
        // }).catch(async err => {
        //     console.log(err);
        //     sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });

        // })
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