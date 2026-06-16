import dotenv from "dotenv";
dotenv.config();

import { downloadMediaMessage } from "baileys";
import WSF from "wa-sticker-formatter";
import memoryManager from "../../utils/memory.js";

import ffmpeg from "fluent-ffmpeg";

let ffmpegPath1 = process.env.FFMPEG_PATH;

if (!ffmpegPath1) {
	try {
		const { default: ffmpegStatic } = await import("ffmpeg-static");
		const { existsSync } = await import("fs");
		ffmpegPath1 = ffmpegStatic && existsSync(ffmpegStatic) ? ffmpegStatic : "ffmpeg";
	} catch (err) {
		ffmpegPath1 = "ffmpeg";
	}
}

// console.log(`🎬 FFmpeg (sticker): ${ffmpegPath1.split(/[\\/]/).pop()}`);
ffmpeg.setFfmpegPath(ffmpegPath1);

import { getMemberData, member } from "../../db/members.js";
import { writeFile, readFile } from "fs/promises";
import fs from "fs";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const getRandom = (ext = "") => memoryManager.generateTempFileName(ext);
	const { senderJid, type, content, isGroup, sendMessageWTyping, evv, extendedMessageOriginal } = msgInfoObj;
	const memberData = await getMemberData(senderJid);

	if (msg.message.extendedTextMessage) {
		msg.message = extendedMessageOriginal?.quotedMessage;
	}

	const isMedia = type === "imageMessage" || type === "videoMessage";
	const isTaggedImage = type === "extendedTextMessage" && content.includes("imageMessage");
	const isTaggedVideo = type === "extendedTextMessage" && content.includes("videoMessage");

	// if (!isGroup) {
	// 	if (memberData.dmLimit <= 0) {
	// 		return sendMessageWTyping(
	// 			from,
	// 			{ text: "You have used your monthly limit.\nWait for next month." },
	// 			{ quoted: msg },
	// 		);
	// 	}
	// 	member.updateOne({ _id: senderJid }, { $inc: { dmLimit: -1 } });
	// }

	let packName = memberData ? await memberData?.customStealText : "eva";
	let authorName = memberData?.customStealText ? undefined : "jacktheboss220";

	const isPackIncluded = args.includes("pack");
	const isAuthorIncluded = args.includes("author");

	if (args.includes("nometadata") === false) {
		packName = isPackIncluded ? evv.split("pack")[1].split("author")[0] : packName;
		authorName = isAuthorIncluded ? evv.split("author")[1].split("pack")[0] : authorName;
	}

	const qualityArg = args.find((a) => /^\d{1,3}$/.test(a));
	const quality = qualityArg ? Math.min(100, Math.max(1, +qualityArg)) : 75;

	const FOCAL_POINTS = ["top", "bottom", "left", "right", "center"];
	const focalPoint = FOCAL_POINTS.find((p) => args.includes(p)) || "center";
	const isCrop = args.includes("crop") || args.includes("c") || FOCAL_POINTS.some((p) => args.includes(p));

	const buildCropFilter = (pos) => {
		const s = `min(iw\\,ih)`;
		const cx = `(iw-min(iw\\,ih))/2`;
		const cy = `(ih-min(iw\\,ih))/2`;
		const xMap = { center: cx, top: cx, bottom: cx, left: `0`, right: `iw-min(iw\\,ih)` };
		const yMap = { center: cy, top: `0`, bottom: `ih-min(iw\\,ih)`, left: cy, right: cy };
		return `crop=${s}:${s}:${xMap[pos]}:${yMap[pos]},scale=512:512,fps=fps=15`;
	};

	const isVideoType = type === "videoMessage" || isTaggedVideo;

	const outputOptions = isCrop
		? [
				`-vcodec`,
				`libwebp`,
				`-vf`,
				buildCropFilter(focalPoint),
				`-lossless`,
				`0`,
				`-q:v`,
				`${quality}`,
				`-loop`,
				`0`,
				`-ss`,
				`00:00:00.0`,
				`-t`,
				`00:00:09.0`,
				`-preset`,
				`default`,
				`-an`,
				`-s`,
				`512:512`,
			]
		: isVideoType
		? [
				`-vcodec`,
				`libwebp`,
				`-vf`,
				`scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=black@0,fps=fps=15`,
				`-lossless`,
				`0`,
				`-q:v`,
				`${quality}`,
				`-loop`,
				`0`,
				`-t`,
				`00:00:09.0`,
				`-preset`,
				`default`,
				`-an`,
			]
		: [
				`-vcodec`,
				`libwebp`,
				`-vf`,
				`scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=yuva420p`,
				`-lossless`,
				`0`,
				`-q:v`,
				`${quality}`,
				`-preset`,
				`default`,
				`-an`,
			];

	const media = isTaggedImage ? getRandom(".png") : getRandom(".mp4");

	if (isMedia || isTaggedImage || isTaggedVideo) {
		if (msg.message?.videoMessage?.seconds > 11) {
			return sendMessageWTyping(from, { text: "Send less than 11 seconds." }, { quoted: msg });
		}

		try {
			const buffer = await downloadMediaMessage(msg, "buffer", {});
			if (!buffer || buffer.length === 0) {
				return sendMessageWTyping(
					from,
					{ text: "❌ Failed to download media. Please try again." },
					{ quoted: msg },
				);
			}

			await writeFile(media, buffer);

			// Verify file was written successfully
			if (!fs.existsSync(media)) {
				return sendMessageWTyping(
					from,
					{ text: "❌ Failed to save media file. Please try again." },
					{ quoted: msg },
				);
			}

			await buildSticker(media);
		} catch (error) {
			memoryManager.safeUnlink(media);
			if (error?.output?.statusCode === 400 || error?.message?.includes("No valid media URL")) {
				return sendMessageWTyping(
					from,
					{
						text: "❌ Can't download quoted media — WhatsApp strips download info from replies.\n\n*Fix:* Send the image/GIF/video *directly* with *-s* as caption instead of replying.",
					},
					{ quoted: msg },
				);
			}
			console.error("[STICKER ERR]", error.message);
			return sendMessageWTyping(from, { text: "❌ Failed to process media. Please try again." }, { quoted: msg });
		}
	} else {
		sendMessageWTyping(from, { text: `❌ *Reply to an image or video*` }, { quoted: msg });
	}

	function buildSticker(media) {
		const ran = getRandom(".webp");

		return new Promise((resolve, reject) => {
			if (!fs.existsSync(media)) {
				return reject(new Error("Input media file not found"));
			}

			ffmpeg(media)
				.on("error", (err) => {
					memoryManager.safeUnlink(media);
					memoryManager.safeUnlink(ran);
					reject(err);
				})
				.on("end", async () => {
					try {
						if (!fs.existsSync(ran)) throw new Error("Output sticker file not created");
						const isVideoSticker = type === "videoMessage" || isTaggedVideo;
						const stickerBuffer = isVideoSticker
							? await readFile(ran)
							: await WSF.setMetadata(packName, authorName, ran);
						await sendMessageWTyping(from, { sticker: Buffer.from(stickerBuffer) }, { quoted: msg });
						resolve();
					} catch (err) {
						reject(err);
					} finally {
						memoryManager.safeUnlink(media);
						memoryManager.safeUnlink(ran);
					}
				})
				.addOutputOptions(outputOptions)
				.toFormat("webp")
				.save(ran);
		});
	}
};

export default () => ({
	cmd: ["sticker", "s"],
	desc: "Convert image or video to sticker.",
	usage: "sticker | s [1-100] [pack <packname>] [author <authorname>] [crop/c] [top|bottom|left|right|center] [nometadata]",
	handler,
});
