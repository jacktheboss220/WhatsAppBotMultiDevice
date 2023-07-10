require('dotenv').config();

const {
    downloadContentFromMessage,
} = require("@adiwajshing/baileys");

//--------------STICKER MODULE------------------------------------------//
const WSF = require("wa-sticker-formatter");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
//-------------------------------------------------------------------------//
const fs = require('fs');
const { getMemberData, member } = require("../../mongo-DB/membersDataDb")
const { writeFile } = require('fs/promises');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

module.exports.command = () => {
    let cmd = ["sticker", "s"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, senderJid, type, content, isGroup, sendMessageWTyping, LogSendToOwner } = msgInfoObj;
    const limit = getMemberData(senderJid).then((res) => { return res });
    const isMedia
        = type === "imageMessage" || type === "videoMessage";
    const isTaggedImage
        = type === "extendedTextMessage" && content.includes("imageMessage");
    const isTaggedVideo
        = type === "extendedTextMessage" && content.includes("videoMessage");

    if (!isGroup) {
        if (limit.dmLimit <= 0) {
            return sendMessageWTyping(from, { text: 'You have used your monthly limit.\nWait for next month.' }, { quoted: msg })
        }
        member.updateOne({ _id: senderJid }, { $inc: { dmLimit: -1 } });
    }

    var packName = "⏤͟͟͞➣⃟⃟🍒𝐷Δ𝑆𝐻𝑈~ ⃟⃟⃟⃟<❤️"
    var authorName = ""

    if (args.includes('pack') == true) {
        packNameDataCollection = false;
        for (let i = 0; i < args.length; i++) {
            if (args[i].includes('pack') == true) {
                packNameDataCollection = true;
            }
            if (args[i].includes('author') == true) {
                packNameDataCollection = false;
            }
            if (packNameDataCollection == true) {
                packName = packName + args[i] + ' '
            }
        }
        if (packName.startsWith('pack ')) {
            packName = `${packName.split('pack ')[1]}`
        }
    }
    if (args.includes('author') == true) {
        authorNameDataCollection = false;
        for (let i = 0; i < args.length; i++) {
            if (args[i].includes('author') == true) {
                authorNameDataCollection = true;
            }
            if (authorNameDataCollection == true) {
                authorName = authorName + args[i] + ' '
            }
            if (authorName.startsWith('author ')) {
                authorName = `${authorName.split('author ')[1]}`
            }
        }
    }


    outputOptions = [
        `-vcodec`,
        `libwebp`,
        `-vf`,
        `scale='min(220,iw)':min'(220,ih)':force_original_aspect_ratio=decrease,fps=15, pad=220:220:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
    ];

    if (args.includes("crop") == true || args.includes("c") == true) {
        outputOptions = [
            `-vcodec`,
            `libwebp`,
            `-vf`,
            `crop=w='min(min(iw\,ih)\,500)':h='min(min(iw\,ih)\,500)',scale=500:500,setsar=1,fps=15`,
            `-loop`,
            `0`,
            `-ss`,
            `00:00:00.0`,
            `-t`,
            `00:00:09.0`,
            `-preset`,
            `default`,
            `-an`,
            `-vsync`,
            `0`,
            `-s`,
            `512:512`,
        ];
    }

    if (packName == "") {
        packName = "Bot"
    }
    if (authorName == "") {
        authorName = ""
    }
    try {
        if ((isMedia && !msg.message.videoMessage || isTaggedImage)) {
            let downloadFilePath;
            if (msg.message.imageMessage) {
                downloadFilePath = msg.message.imageMessage;
            } else {
                downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }
            const stream = await downloadContentFromMessage(downloadFilePath, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }
            const media = getRandom('.png');
            const ran = getRandom('.webp');

            ffmpeg(`./${media}`).input(media).on("error", function (err) {
                fs.unlinkSync(media);
            }).addOutputOptions(outputOptions).toFormat("webp").save(ran).on("end", function () {
                buildSticker();
            });

            await writeFile(media, buffer);
            async function buildSticker() {
                if (args.includes("nometadata") == true) {
                    WSF.setMetadata(
                        "",
                        "",
                        ran
                    ).then(() => {
                        sock.sendMessage(
                            from,
                            { sticker: fs.readFileSync(ran) },
                            { quoted: msg }
                        ).then(() => {
                            try {
                                fs.unlinkSync(ran);
                            } catch { }
                        });
                    });
                } else {
                    WSF.setMetadata(
                        packName,
                        authorName,
                        ran
                    ).then(() => {
                        sock.sendMessage(
                            from,
                            {
                                sticker: fs.readFileSync(ran)
                            },
                            { quoted: msg }
                        ).then(() => {
                            try {
                                fs.unlinkSync(media);
                                fs.unlinkSync(ran);
                            } catch { }
                        });
                    });
                }
            }
        } else if ((isMedia && msg.message.videoMessage.seconds < 11 || isTaggedVideo && msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage.seconds < 11)) {
            let downloadFilePath;
            if (msg.message.videoMessage) {
                downloadFilePath = msg.message.videoMessage;
            } else {
                downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage;
            }
            const stream = await downloadContentFromMessage(downloadFilePath, 'video');
            let buffer = Buffer.from([])
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }
            const media = getRandom('.mp4');
            const ran = getRandom(".webp");
            await writeFile(media, buffer);
            ffmpeg(`./${media}`).input(media).on("error", function (err) {
                fs.unlinkSync(media);
            }).addOutputOptions(outputOptions).toFormat("webp").save(ran).on("end", function () {
                buildSticker();
            });

            async function buildSticker() {
                if (args.includes("nometadata") == true) {
                    WSF.setMetadata(
                        "",
                        "",
                        ran
                    ).then(() => {
                        sock.sendMessage(
                            from,
                            { sticker: fs.readFileSync(ran) },
                            { quoted: msg }
                        ).then(() => {
                            try {
                                fs.unlinkSync(ran);
                            } catch { }
                        });
                    });
                } else {
                    WSF.setMetadata(
                        packName,
                        authorName,
                        ran
                    ).then(() => {
                        sock.sendMessage(
                            from,
                            { sticker: fs.readFileSync(ran) },
                            { quoted: msg }
                        ).then(() => {
                            try {
                                fs.unlinkSync(media);
                                fs.unlinkSync(ran);
                            } catch { }
                        });
                    });
                }
            }
        } else if ((isMedia && msg.message.videoMessage.seconds >= 11 || isTaggedVideo && msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage.seconds >= 11)) {
            return sendMessageWTyping(
                from,
                {
                    text: "Send less then 11 seconds."
                },
                { quoted: msg }
            )
            // let downloadFilePath;
            // if (msg.message.videoMessage) {
            //     downloadFilePath = msg.message.videoMessage;
            // } else {
            //     downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage;
            // }
            // const stream = await downloadContentFromMessage(downloadFilePath, 'video');
            // let buffer = Buffer.from([]);
            // for await (const chunk of stream) {
            //     buffer = Buffer.concat([buffer, chunk])
            // }
            // const media1 = getRandom('.mp4');
            // const media = getRandom('.mp4');
            // const ran = getRandom(".webp");
            // await writeFile(media, buffer);

            // ffmpeg(`./${media}`)
            //     .setStartTime('00:00:00')
            //     .setDuration('9')
            //     .output(media1).on('end', function (err) {
            //         if (!err) { console.log('conversion Done') }
            //         ffmpeg(`./${media1}`).input(media1).on("error", function (err) {
            //             console.log(err);
            //             fs.unlinkSync(media);
            //         }).addOutputOptions(outputOptions).toFormat("webp").save(ran).on("end", function () {
            //             buildSticker();
            //         });
            //     }).on('error', err => {
            //         fs.unlinkSync(media1);
            //         fs.unlinkSync(media);
            //         fs.unlinkSync(ran);
            //         return console.log('error: ', err)
            //     }).run();

            // async function buildSticker() {
            //     if (args.includes("nometadata") == true) {
            //         await WSF.setMetadata(
            //             "",
            //             "",
            //             ran
            //         )
            //         await sock.sendMessage(
            //             from,
            //             { sticker: fs.readFileSync(ran) },
            //             { quoted: msg }
            //         ).then(() => {
            //             try {
            //                 fs.unlinkSync(media);
            //                 fs.unlinkSync(ran);
            //                 // fs.unlinkSync(media1);
            //             } catch { }
            //         });
            //     } else {
            //         await WSF.setMetadata(
            //             packName,
            //             authorName,
            //             ran
            //         )
            //         await sock.sendMessage(
            //             from,
            //             { sticker: fs.readFileSync(ran) },
            //             { quoted: msg }
            //         ).then(() => {
            //             try {
            //                 fs.unlinkSync(media);
            //                 fs.unlinkSync(ran);
            //                 // fs.unlinkSync(media1);
            //             } catch { }
            //         });
            //     }
            // }
        } else {
            sendMessageWTyping(from, { text: `❌ *Error reply to image or video only* ` }, { quoted: msg });
            console.log('Error not replied');
        }
    } catch (err) {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}
