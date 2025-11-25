import { createCanvas, loadImage } from "canvas";
import { Sticker } from "wa-sticker-formatter";
import fs from "fs";

const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv } = msgInfoObj;

	if (!args[0] && !msg.message.extendedTextMessage) {
		return sendMessageWTyping(from, { text: `❌ *Enter some text*` }, { quoted: msg });
	}

	let message = evv || msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
	message = message.split(":").join("\n");

	const canvas = createCanvas(512, 512);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "#ffffff"; // Background color
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.font = "80px Arial";
	ctx.fillStyle = "#ff0000"; // Font color
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(message, canvas.width / 2, canvas.height / 2);

	const filename = getRandom(".png");
	const out = fs.createWriteStream(`./${filename}`);
	const stream = canvas.createPNGStream();
	stream.pipe(out);

	out.on("finish", async () => {
		const sticker = new Sticker(`./${filename}`, {
			pack: "Bot",
			author: "eva",
		});
		await sticker.build();
		const stickerBuffer = await sticker.get();
		await sock.sendMessage(from, { sticker: Buffer.from(stickerBuffer) }, { quoted: msg });
		fs.unlinkSync(filename); // Clean up after sending
	});
};

export default () => ({
	cmd: ["tts", "attp"],
	desc: "Convert text to sticker",
	usage: "tts <text>",
	handler,
});
