const {
    downloadContentFromMessage,
} = require("@adiwajshing/baileys");

require('dotenv').config();
const deepai = require('deepai');
const deepAIkey = process.env.DEEPAI_KEY;
deepai.setApiKey(deepAIkey);
const fs = require('fs');
const { writeFile } = require('fs/promises');
const getRandom = (ext) => { return `${Math.floor(Math.random() * 10000)}${ext}` };

module.exports.command = () => {
    let cmd = ["nsfw"];
    return { cmd, handler };
}


const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { type, content, sendMessageWTyping } = msgInfoObj;
    let downloadFilePath;
    if (type === "imageMessage") {
        downloadFilePath = msg.message.imageMessage;
    } else if (type === "extendedTextMessage" && content.includes("imageMessage")) {
        downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
    } else {
        return sendMessageWTyping(from, { text: `*Reply to Image Only*` }, { quoted: msg });
    }
    const stream = await downloadContentFromMessage(downloadFilePath, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    const media = getRandom('.png');
    await writeFile(media, buffer);

    await deepai.callStandardApi("nsfw-detector", {
        image: fs.createReadStream(`${media}`),
    }).then((res) => {
        let mess = `*Nsfw Score* : ${res.output.nsfw_score * 100}%\n`;
        console.log('NSFW Score : ', res.output);
        if (res.output.detections.length > 0) {
            for (let i = 0; i < res.output.detections.length; i++) {
                mess += `*Nsfw* : ${res.output.detections[i].name} : ${res.output.detections[i].confidence * 100}%\n`;
            }
            sendMessageWTyping(from, { text: mess }, { quoted: msg });
        } else
            sendMessageWTyping(from, { text: mess }, { quoted: msg });
        try {
            fs.unlinkSync(media);
        } catch { }
    }).catch((err) => {
        console.log("error ", err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    });
}
