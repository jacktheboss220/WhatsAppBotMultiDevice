import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import axios from "axios";
import memoryManager from "../../../utils/memory.js";
import ffmpeg from "fluent-ffmpeg";

// Get FFmpeg path - prioritize environment variable
let ffmpegPath1 = process.env.FFMPEG_PATH;

if (!ffmpegPath1) {
	// If no custom path, try to use ffmpeg-static or fallback to system ffmpeg
	try {
		// Dynamic import of ffmpeg-static (it might not have the binary)
		const { default: ffmpegStatic } = await import("ffmpeg-static");
		ffmpegPath1 = ffmpegStatic || "ffmpeg";
	} catch (err) {
		// If ffmpeg-static fails, use system ffmpeg
		ffmpegPath1 = "ffmpeg";
	}
}

// console.log(`🎬 FFmpeg (meme):    ${ffmpegPath1.split(/[\\/]/).pop()}`);
ffmpeg.setFfmpegPath(ffmpegPath1);

const getRandom = (ext) => {
	return memoryManager.generateTempFileName(ext);
};

import { delay } from "baileys";

const downloadMedia = async (url, filePath) => {
	const writer = memoryManager.createOptimizedWriteStream(filePath);
	const response = await axios({
		url,
		method: "GET",
		responseType: "stream",
		maxContentLength: 50 * 1024 * 1024,
		timeout: 30000,
	});

	memoryManager.registerStream(response.data);
	memoryManager.registerStream(writer);

	response.data.pipe(writer);
	return new Promise((resolve, reject) => {
		writer.on("finish", () => resolve("done"));
		writer.on("error", (err) => {
			memoryManager.safeUnlink(filePath);
			reject(err);
		});
		response.data.on("error", (err) => {
			memoryManager.safeUnlink(filePath);
			reject(err);
		});
	});
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	const down_meme = getRandom(".mp4");
	const down_gif = getRandom(".gif");
	const memeURL = "https://meme-api.com/gimme";
	await axios.get(`${memeURL}`).then((res) => {
		let url = res.data.url;
		if (url.includes("jpg") || url.includes("jpeg") || url.includes("png")) {
			sendMessageWTyping(from, { image: { url: res.data.url }, caption: `${res.data.title}` });
		} else {
			const outputOptions = [`-movflags faststart`, `-pix_fmt yuv420p`, `-vf`, `scale=trunc(iw/2)*2:trunc(ih/2)*2`];
			downloadMedia(res.data.url, down_gif)
				.then(async (res1) => {
					if (res1 == "done") {
						ffmpeg(down_gif)
							.input(down_gif)
							.addOutputOptions(outputOptions)
							.save(down_meme)
							.on("end", async () => {
								try {
									await delay(2000);
									const videoStream = memoryManager.createOptimizedReadStream(down_meme, {
										autoDelete: true,
									});
									await sendMessageWTyping(from, {
										video: videoStream,
										caption: `${res.data.title}`,
										gifPlayback: true,
									});
								} catch (streamError) {
									console.error("Streaming error, using buffer:", streamError);
									await sendMessageWTyping(from, {
										video: fs.readFileSync(down_meme),
										caption: `${res.data.title}`,
										gifPlayback: true,
									});
								} finally {
									memoryManager.safeUnlink(down_gif);
									memoryManager.safeUnlink(down_meme);
								}
							})
							.on("error", (err) => {
								console.error("FFmpeg error:", err);
								memoryManager.safeUnlink(down_gif);
								memoryManager.safeUnlink(down_meme);
							});
					}
				})
				.catch((err) => {
					console.error("Download error:", err);
					memoryManager.safeUnlink(down_gif);
				});
		}
	});
};

export default () => ({
	cmd: ["meme"],
	desc: "Get random meme",
	usage: "meme",
	handler,
});
