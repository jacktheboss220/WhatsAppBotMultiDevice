const fs = require('fs');
const { UltimateTextToImage } = require('ultimate-text-to-image');
const { Sticker } = require("wa-sticker-formatter");

const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;

    if (!args[0] && !msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: `❌ *Enter some text*` }, { quoted: msg });

    let message = evv || msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
    message = message.split(":").join("\n")
    const textToImage = new UltimateTextToImage(`${message}`, {
        width: 512,
        maxWidth: 1000,
        maxHeight: 1000,
        fontFamily: "Arial",
        fontColor: "#ff0000",
        fontSize: 80,
        minFontSize: 50,
        lineHeight: 90,
        autoWrapLineHeightMultiplier: 1.2,
        margin: 1,
        marginBottom: 1,
        align: "center",
        valign: "middle",
        // backgroundColor: "#000000",
        // borderColor: 0xFF000099,
        // borderSize: 2,
        // underlineColor: "#00FFFF33",
        // underlineSize: 2,
    }).render();

    const streamPng = textToImage.toStream();
    const filename = getRandom(".png");

    fileSaved(streamPng, filename).then(async () => {
        const sticker = new Sticker(`./${filename}`, {
            pack: "Bot",
            author: "eva",
        });
        await sticker.build();
        const stickerBuffer = await sticker.get();
        await sock.sendMessage(from, { sticker: Buffer.from(stickerBuffer) }, { quoted: msg });
        fs.unlinkSync(filename);
    });
}

async function fileSaved(streamPng, filename) {
    const out = fs.createWriteStream(`./${filename}`);
    streamPng.pipe(out);
    return new Promise((resolve, reject) => out.on("finish", resolve).on("error", reject));
}


module.exports.command = () => ({ cmd: ["tts", "attp"], handler });