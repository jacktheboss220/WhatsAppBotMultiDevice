import fs from "fs";
import yts from "yt-search";
import memoryManager from "../../../utils/memory.js";
import { readFileEfficiently, isValidVideoFile } from "../../../utils/file.js";
import { youtubedl, ytdlpOpts, parseYouTubeUrl, downloadLimits } from "../../../utils/ytdlp.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

const findVideoURL = async (name) => {
	const r = await yts(`${name}`);
	if (!r.all || r.all.length === 0) return null;
	return r.all[0].url;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, command, evv } = msgInfoObj;

	if (command != "vs") {
		if (!args[0] || !parseYouTubeUrl(args[0])) {
			return sendMessageWTyping(from, { text: `Enter a youtube link after yt` }, { quoted: msg });
		}
	}

	let URL = command == "vs" ? args[0] : parseYouTubeUrl(args[0]);
	if (command == "vs") {
		if (!args[0]) return sendMessageWTyping(from, { text: `Enter something to search` }, { quoted: msg });
		try {
			URL = await findVideoURL(evv);
			if (!URL) return sendMessageWTyping(from, { text: `❌ No video found for: ${evv}` }, { quoted: msg });
		} catch (searchError) {
			console.error("Video search error:", searchError);
			return sendMessageWTyping(from, { text: `❌ Search failed. Please try again.` }, { quoted: msg });
		}
	}

	const fileDown = getRandom(".mp4");
	let fileDown_final = fileDown;

	try {
		await sendMessageWTyping(from, { text: `⏳ Processing video... Please wait.` }, { quoted: msg });

		// Get info (title + duration)
		let title = "Unknown Video";
		let duration = 0;
		try {
			const info = await youtubedl(URL, await ytdlpOpts({ dumpSingleJson: true }));
			title = info.title || "Unknown Video";
			duration = info.duration || 0;
		} catch (infoError) {
			console.log("Info fetch failed:", infoError.message);
		}

		if (duration > 1800) {
			return sendMessageWTyping(
				from,
				{ text: `❌ Video is too long (${Math.round(duration / 60)} minutes). Maximum 30 minutes allowed.` },
				{ quoted: msg }
			);
		}

		console.log("Downloading:", title, URL);

		// Prefer a pre-muxed mp4 (no ffmpeg merge needed) → avoids merge failures on servers.
		// Falls back to merged streams only when no single-stream mp4 exists.
		const result = await youtubedl(
			URL,
			await ytdlpOpts({
				format: "best[height<=720][ext=mp4]/bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]/best",
				mergeOutputFormat: "mp4",
				output: fileDown,
				...downloadLimits,
			})
		);
		console.log("yt-dlp result:", JSON.stringify(result)?.slice(0, 300));

		// yt-dlp may write a different extension; check the exact path and nearby variants
		let actualFile = fileDown;
		if (!fs.existsSync(fileDown)) {
			const base = fileDown.replace(/\.[^.]+$/, "");
			const variants = [".mp4", ".mkv", ".webm"].map((e) => base + e);
			actualFile = variants.find((f) => fs.existsSync(f)) || fileDown;
		}

		if (!fs.existsSync(actualFile)) {
			console.error("File not found after download. Expected:", fileDown);
			return sendMessageWTyping(from, { text: "❌ Video file was not created." }, { quoted: msg });
		}
		fileDown_final = actualFile;
		const stats = await fs.promises.stat(fileDown_final);
		if (stats.size === 0) {
			return sendMessageWTyping(from, { text: "❌ Video file is empty." }, { quoted: msg });
		}
		if (!isValidVideoFile(fileDown_final)) {
			return sendMessageWTyping(from, { text: "❌ Video file is not valid or not supported." }, { quoted: msg });
		}

		const fileSizeMB = stats.size / (1024 * 1024);
		if (fileSizeMB > 60) {
			memoryManager.safeUnlink(fileDown_final);
			return sendMessageWTyping(
				from,
				{ text: `❌ Video is too large to send on WhatsApp (${fileSizeMB.toFixed(2)}MB). Limit is 60MB.` },
				{ quoted: msg }
			);
		}

		// Read into buffer before enqueuing — BullMQ processes jobs async, file would be
		// deleted by the finally block before the job runs if we pass a path.
		const videoBuffer = await readFileEfficiently(fileDown_final);
		await sendMessageWTyping(
			from,
			{
				video: videoBuffer,
				caption: `🎥 *${title}*\n📊 Size: ${fileSizeMB.toFixed(2)}MB`,
				mimetype: "video/mp4",
			},
			{ quoted: msg }
		);
	} catch (err) {
		console.error("YTDL Handler Error:", err);
		const m = (err.message || "").toLowerCase();
		let errorMsg = "❌ Download failed. ";
		if (m.includes("sign in to confirm") || m.includes("bot")) {
			errorMsg += "YouTube is blocking this server. Set YTDLP_COOKIES to fix.";
		} else if (m.includes("age")) {
			errorMsg += "Age-restricted. Set YTDLP_COOKIES to download.";
		} else if (m.includes("unavailable") || m.includes("private")) {
			errorMsg += "Video is unavailable or private.";
		} else {
			errorMsg += "Please try with a different video.";
		}
		sendMessageWTyping(from, { text: errorMsg }, { quoted: msg });
	} finally {
		memoryManager.safeUnlink(fileDown_final);
		if (fileDown_final !== fileDown) memoryManager.safeUnlink(fileDown);
	}
};

export default () => ({
	cmd: ["yt", "ytv", "vs"],
	desc: "Download a YouTube video from its link.",
	usage: "yt <youtube link>",
	handler,
});
