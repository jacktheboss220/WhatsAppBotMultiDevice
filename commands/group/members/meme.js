const fs = require("fs");
const axios = require("axios");
const memoryManager = require("../../../functions/memoryUtils");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const getRandom = (ext) => {
	return memoryManager.generateTempFileName(ext);
};

const { delay } = require("baileys");

let down_meme = getRandom(".mp4");
let down_gif = getRandom(".gif");

const downloadMedia = async (url) => {
	const writer = memoryManager.createOptimizedWriteStream(down_gif);
	const response = await axios({
		url,
		method: "GET",
		responseType: "stream",
		maxContentLength: 50 * 1024 * 1024, // 50MB limit
		timeout: 30000, // 30 second timeout
	});

	// Register the response stream for monitoring
	memoryManager.registerStream(response.data);
	memoryManager.registerStream(writer);

	response.data.pipe(writer);
	return new Promise((resolve, reject) => {
		writer.on("finish", () => resolve("done"));
		writer.on("error", (err) => {
			memoryManager.safeUnlink(down_gif);
			reject(err);
		});
		response.data.on("error", (err) => {
			memoryManager.safeUnlink(down_gif);
			reject(err);
		});
	});
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const memeURL = "https://meme-api.com/gimme";
	await axios.get(`${memeURL}`).then((res) => {
		let url = res.data.url;
		if (url.includes("jpg") || url.includes("jpeg") || url.includes("png")) {
			sock.sendMessage(from, { image: { url: res.data.url }, caption: `${res.data.title}` });
		} else {
			outputOptions = [`-movflags faststart`, `-pix_fmt yuv420p`, `-vf`, `scale=trunc(iw/2)*2:trunc(ih/2)*2`];
			downloadMedia(res.data.url)
				.then(async (res1) => {
					if (res1 == "done") {
						const ffmpegProcess = ffmpeg(down_gif)
							.input(down_gif)
							.addOutputOptions(outputOptions)
							.save(down_meme)
							.on("end", async () => {
								try {
									await delay(2000); // Reduced delay
									const videoStream = memoryManager.createOptimizedReadStream(down_meme, {
										autoDelete: true,
									});
									await sock.sendMessage(from, {
										video: videoStream,
										caption: `${res.data.title}`,
										gifPlayback: true,
									});
								} catch (streamError) {
									console.error("Streaming error, using buffer:", streamError);
									// Fallback to buffer method
									await sock.sendMessage(from, {
										video: fs.readFileSync(down_meme),
										caption: `${res.data.title}`,
										gifPlayback: true,
									});
								} finally {
									// Cleanup files
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

module.exports.command = () => ({
	cmd: ["meme"],
	desc: "Get random meme",
	usage: "meme",
	handler,
});
