import fs from "fs";
import path from "path";
import yts from "yt-search";
import ffmpeg from "ffmpeg-static";
import defaultYoutubedl, { create } from "youtube-dl-exec";
import memoryManager from "../../../utils/memory.js";
import { readFileEfficiently, isValidVideoFile } from "../../../utils/file.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

// Use the system yt-dlp binary when YTDLP_PATH is set (e.g. /usr/local/bin/yt-dlp on
// the server). Otherwise fall back to the binary bundled with youtube-dl-exec.
const youtubedl = process.env.YTDLP_PATH ? create(process.env.YTDLP_PATH) : defaultYoutubedl;

// Optional cookies file (Netscape cookies.txt) for server-side age/bot bypass.
// Set YTDLP_COOKIES=/path/to/cookies.txt in .env to fix "Sign in to confirm" on server.
const COOKIES = process.env.YTDLP_COOKIES;

// Single, simple yt-dlp option set. No agent swapping, no ytdl-core fallback.
const ytdlpOpts = (extra = {}) => {
	const opts = {
		noCheckCertificates: true,
		noWarnings: true,
		noPlaylist: true,
		forceIpv4: true,
		ffmpegLocation: ffmpeg,
		// tv + web clients bypass most age gates without login
		extractorArgs: "youtube:player_client=tv,web_safari,mweb",
		...extra,
	};
	if (COOKIES) opts.cookies = COOKIES;
	return opts;
};

const findVideoURL = async (name) => {
	const r = await yts(`${name}`);
	if (!r.all || r.all.length === 0) return null;
	return r.all[0].url;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, command, evv } = msgInfoObj;

	if (command != "vs") {
		if (!args[0] || !args[0].startsWith("http")) {
			return sendMessageWTyping(from, { text: `Enter youtube link after yt` }, { quoted: msg });
		}
	}

	let URL = args[0];
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

	try {
		await sendMessageWTyping(from, { text: `⏳ Processing video... Please wait.` }, { quoted: msg });

		// Get info (title + duration)
		let title = "Unknown Video";
		let duration = 0;
		try {
			const info = await youtubedl(URL, ytdlpOpts({ dumpSingleJson: true }));
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

		// Download + merge in one yt-dlp call (yt-dlp uses ffmpeg-static to merge)
		await youtubedl(
			URL,
			ytdlpOpts({
				format: "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best",
				mergeOutputFormat: "mp4",
				output: fileDown,
			})
		);

		if (!fs.existsSync(fileDown)) {
			return sendMessageWTyping(from, { text: "❌ Video file was not created." }, { quoted: msg });
		}
		const stats = await fs.promises.stat(fileDown);
		if (stats.size === 0) {
			return sendMessageWTyping(from, { text: "❌ Video file is empty." }, { quoted: msg });
		}
		if (!isValidVideoFile(fileDown)) {
			return sendMessageWTyping(from, { text: "❌ Video file is not valid or not supported." }, { quoted: msg });
		}

		const fileSizeMB = stats.size / (1024 * 1024);
		if (fileSizeMB > 60) {
			memoryManager.safeUnlink(fileDown);
			return sendMessageWTyping(
				from,
				{ text: `❌ Video is too large to send on WhatsApp (${fileSizeMB.toFixed(2)}MB). Limit is 60MB.` },
				{ quoted: msg }
			);
		}

		const normalizedFileDown = fileDown.split(path.sep).join("/");
		try {
			await sendMessageWTyping(
				from,
				{
					video: normalizedFileDown,
					caption: `🎥 *${title}*\n📊 Size: ${fileSizeMB.toFixed(2)}MB`,
					mimetype: "video/mp4",
				},
				{ quoted: msg }
			);
		} catch (sendPathError) {
			const videoBuffer = await readFileEfficiently(fileDown);
			await sendMessageWTyping(
				from,
				{
					video: videoBuffer,
					caption: `🎥 *${title}*\n📊 Size: ${fileSizeMB.toFixed(2)}MB`,
					mimetype: "video/mp4",
				},
				{ quoted: msg }
			);
		}
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
		memoryManager.safeUnlink(fileDown);
	}
};

export default () => ({
	cmd: ["yt", "ytv", "vs"],
	desc: "Download youtube video",
	usage: "yt <youtube link>",
	handler,
});
