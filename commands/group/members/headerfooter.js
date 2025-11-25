import { downloadContentFromMessage } from "baileys";
import memeMaker from '@erickwendel/meme-maker';
import { writeFile } from 'fs/promises';
import fs from 'fs';

const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { type, content, evv, sendMessageWTyping } = msgInfoObj;
    const isMedia = type === "imageMessage" || type === "videoMessage";
    const isTaggedImage = type === "extendedTextMessage" && content.includes("imageMessage");

    if (!args[0]) {
        return sendMessageWTyping(from, { text: `*Use* -textmeme _FontTop;FontBottom;FontSize;FontColor;FontStrokeColor_` }, { quoted: msg });
    }

    console.log('content', evv);
    let TopText = '', BottomText = '', FontColor = 'Black', FontStroke = 'Black', FontSize = 0;

    const evvSplit = evv.split(";");
    const evvLength = evvSplit.length;

    if (evvLength >= 1) {
        if (evvLength === 1) {
            BottomText = evvSplit[0].trim();
        } else if (evvLength >= 2) {
            const parsedFontSize = parseInt(evvSplit[1].trim());
            if (!isNaN(parsedFontSize)) {
                FontSize = parsedFontSize;
                BottomText = evvSplit[0].trim();
            } else {
                TopText = evvSplit[0].trim();
                BottomText = evvSplit[1].trim();
            }
        }

        if (evvLength >= 3) {
            const parsedFontSize = parseInt(evvSplit[2].trim());
            if (!isNaN(parsedFontSize)) {
                FontSize = parsedFontSize;
            } else {
                FontColor = evvSplit[2].trim();
            }
        }

        if (evvLength >= 4) {
            const parsedFontSize = parseInt(evvSplit[3].trim());
            if (!isNaN(parsedFontSize)) {
                FontSize = parsedFontSize;
            } else {
                FontColor = evvSplit[3].trim();
                FontStroke = evvSplit[3].trim();
            }
        }

        if (evvLength >= 5) {
            FontColor = evvSplit[3].trim();
            FontStroke = evvSplit[4].trim();
        }
    }

    if ((isMedia && !msg.message.videoMessage) || isTaggedImage) {
        let downloadFilePath;
        if (msg.message.imageMessage) {
            downloadFilePath = msg.message.imageMessage;
        } else {
            downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
        }
        const stream = await downloadContentFromMessage(downloadFilePath, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const media = getRandom('.jpeg');
        await writeFile(media, buffer);
        const MemePath = getRandom('.png');

        const options = {
            image: media,
            outfile: MemePath,
            topText: TopText,
            bottomText: BottomText,
            fontSize: (FontSize === 0) ? 50 : FontSize,
            fontFill: FontColor,
            strokeColor: FontStroke,
            strokeWeight: 1
        };

        memeMaker(options).then(() => {
            sock.sendMessage(from,
                { image: fs.readFileSync(MemePath) },
                { quoted: msg }
            ).then(() => {
                try {
                    fs.unlinkSync(MemePath);
                    fs.unlinkSync(media);
                } catch (error) {
                    console.error(error);
                }
            });
            console.log('Sent');
        });
    } else {
        sendMessageWTyping(from, { text: `*Reply to Image Only*` }, { quoted: msg });
    }
};


export default () => ({
    cmd: ["text", "txt", "texmeme"],
    desc: "Create a meme with text",
    usage: "textmeme _FontTop;FontBottom;FontSize;FontColor;FontStrokeColor_ | reply to an image",
    handler
});