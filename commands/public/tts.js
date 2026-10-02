import { createCanvas } from "@napi-rs/canvas";
import { Sticker } from "wa-sticker-formatter";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv, extendedMessageOriginal } = msgInfoObj;

	if (!args[0] && !extendedMessageOriginal) {
		return sendMessageWTyping(from, { text: `❌ *Enter some text*` }, { quoted: msg });
	}

	let message = evv || extendedMessageOriginal?.quotedMessage?.conversation;
	if (!message) return sendMessageWTyping(from, { text: `❌ *Enter some text*` }, { quoted: msg });
	message = message.slice(0, 100).split(":").join("\n");

	try {
		const canvas = createCanvas(512, 512);
		const ctx = canvas.getContext("2d");

		ctx.fillStyle = "#ffffff"; // Background color
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = "#ff0000"; // Font color
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		// shrink the font until the widest line fits the sticker (long text used to run off the canvas)
		const lines = message.split("\n");
		let size = 80;
		for (; size > 16; size -= 4) {
			ctx.font = `${size}px Arial`;
			if (Math.max(...lines.map((l) => ctx.measureText(l).width)) <= canvas.width - 32) break;
		}
		const lineHeight = size * 1.2;
		const top = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
		lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, top + i * lineHeight));

		// @napi-rs/canvas has no createPNGStream() (that is node-canvas), and no temp file is needed:
		// the sticker builder accepts the PNG buffer directly.
		const sticker = new Sticker(canvas.toBuffer("image/png"), { pack: "Bot", author: "eva" });
		await sticker.build();
		const stickerBuffer = await sticker.get();
		await sendMessageWTyping(from, { sticker: Buffer.from(stickerBuffer) }, { quoted: msg });
	} catch (err) {
		console.error("[TTS ERR]", err.message);
		sendMessageWTyping(from, { text: `❌ *Failed to create sticker*` }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["attp"],
	desc: "Turn text into a sticker.",
	usage: "attp <text>",
	handler,
});
