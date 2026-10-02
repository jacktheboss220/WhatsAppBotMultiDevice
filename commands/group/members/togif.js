import ffmpeg from "fluent-ffmpeg";
import { downloadMediaMessage } from "baileys";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import nodeWebpmux from "node-webpmux"; // CommonJS: no named exports under strict ESM loaders (same pattern as steal.js)
const { Image } = nodeWebpmux;
import { createCanvas, ImageData } from "@napi-rs/canvas";
import memoryManager from "../../../utils/memory.js";
import { getMediaFlags } from "../../../utils/mediaFlags.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

const VIDEO_OPTS = ["-movflags faststart", "-pix_fmt yuv420p", "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2"];

const runFfmpeg = (input, out, inputOpts = []) =>
	new Promise((resolve, reject) =>
		ffmpeg(input).inputOptions(inputOpts).outputOptions(VIDEO_OPTS).noAudio().on("end", resolve).on("error", reject).save(out),
	);

// Older ffmpeg builds (apt/system) can't decode animated WebP (0 frames). Split it into PNG
// frames ourselves, then let ffmpeg treat them as a plain image sequence.
// ponytail: constant fps from the average frame delay; per-frame timing if stickers look off.
export const animatedWebpToMp4 = async (webpPath, out) => {
	const img = new Image();
	await img.load(await readFile(webpPath));
	if (!img.hasAnim) throw new Error("not an animated webp");
	await Image.initLib();

	const dir = await mkdtemp(join(tmpdir(), "togif-"));
	try {
		const canvas = createCanvas(img.width, img.height);
		const ctx = canvas.getContext("2d");
		let totalDelay = 0;
		for (let i = 0; i < img.frames.length; i++) {
			const { x, y, width, height, delay, blend, dispose } = img.frames[i];
			const px = await img.getFrameData(i);
			const tile = createCanvas(width, height);
			tile.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(px), width, height), 0, 0);
			if (!blend) ctx.clearRect(x, y, width, height);
			ctx.drawImage(tile, x, y);
			await writeFile(join(dir, `f${String(i).padStart(4, "0")}.png`), canvas.toBuffer("image/png"));
			if (dispose) ctx.clearRect(x, y, width, height);
			totalDelay += delay || 100;
		}
		const fps = Math.min(50, Math.max(1, Math.round((1000 * img.frames.length) / totalDelay)));
		await runFfmpeg(join(dir, "f%04d.png"), out, [`-framerate ${fps}`]);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { type, content, sendMessageWTyping, extendedMessageOriginal } = msgInfoObj;

	if (extendedMessageOriginal) {
		msg["message"] = extendedMessageOriginal.quotedMessage;
	}

	const { isMedia, isTaggedSticker } = getMediaFlags(type, content);
	if (!isMedia && !isTaggedSticker) {
		return sendMessageWTyping(from, { text: "❌ *Reply to an animated sticker*" }, { quoted: msg });
	}

	const media = getRandom(".webp");
	const out = getRandom(".mp4");
	try {
		await writeFile(media, await downloadMediaMessage(msg, "buffer", {}));
		try {
			await runFfmpeg(media, out);
		} catch (ffErr) {
			console.error("[togif] ffmpeg direct failed, splitting frames:", ffErr.message.split("\n")[0]);
			await animatedWebpToMp4(media, out);
		}
		// Buffer, not path: the send is queued and the temp files are deleted right after.
		await sendMessageWTyping(
			from,
			{ video: await readFile(out), gifPlayback: true, mimetype: "video/mp4", caption: "Sent by eva" },
			{ quoted: msg },
		);
	} catch (err) {
		console.error("[togif]", err.message);
		sendMessageWTyping(from, { text: "❌ Could not convert. Is it an animated sticker?" }, { quoted: msg });
	} finally {
		memoryManager.safeUnlink(media);
		memoryManager.safeUnlink(out);
	}
};

export default () => ({
	cmd: ["togif", "gif"],
	desc: "Convert an animated sticker into a GIF. Reply to the sticker.",
	usage: "togif | reply to a sticker",
	handler,
});
