import fs from "fs";
import ffmpeg from "ffmpeg-static";
import defaultYoutubedl, { create } from "youtube-dl-exec";
import memoryManager from "../../../utils/memory.js";
import { readFileEfficiently } from "../../../utils/file.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

// Use the system yt-dlp binary when YTDLP_PATH is set (e.g. /usr/local/bin/yt-dlp on
// the server). Otherwise fall back to the binary bundled with youtube-dl-exec.
const youtubedl = process.env.YTDLP_PATH ? create(process.env.YTDLP_PATH) : defaultYoutubedl;

// Optional cookies file (Netscape cookies.txt) for server-side age/bot bypass.
// Set YTDLP_COOKIES=/path/to/cookies.txt in .env to fix "Sign in to confirm" on server.
const COOKIES = process.env.YTDLP_COOKIES;

const ytdlpOpts = (extra = {}) => {
	const opts = {
		noCheckCertificates: true,
		noWarnings: true,
		noPlaylist: true,
		forceIpv4: true,
		ffmpegLocation: ffmpeg,
		extractorArgs: "youtube:player_client=tv,web_safari,mweb",
		...extra,
	};
	if (COOKIES) opts.cookies = COOKIES;
	return opts;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	if (!args[0] || !args[0].startsWith("http")) {
		return sendMessageWTyping(from, { text: `❌ *Enter Youtube link*` }, { quoted: msg });
	}

	const fileDown = getRandom(".mp3");

	try {
		await youtubedl(
			args[0],
			ytdlpOpts({
				format: "bestaudio[ext=m4a]/bestaudio/best",
				extractAudio: true,
				audioFormat: "mp3",
				audioQuality: 0,
				output: fileDown,
			})
		);

		if (!fs.existsSync(fileDown)) throw new Error("Audio file was not created");
		console.log("Audio downloaded");

		const audioBuffer = await readFileEfficiently(fileDown);
		await sendMessageWTyping(from, { audio: audioBuffer, mimetype: "audio/mpeg" }, { quoted: msg });
		console.log("Sent");
	} catch (err) {
		console.error("yta error:", err);
		const m = (err.message || "").toLowerCase();
		let errorMsg = "❌ Download failed. ";
		if (m.includes("sign in to confirm") || m.includes("bot")) {
			errorMsg += "YouTube is blocking this server. Set YTDLP_COOKIES to fix.";
		} else if (m.includes("age")) {
			errorMsg += "Age-restricted. Set YTDLP_COOKIES to download.";
		} else {
			errorMsg += "Please try a different link.";
		}
		sendMessageWTyping(from, { text: errorMsg }, { quoted: msg });
	} finally {
		memoryManager.safeUnlink(fileDown);
	}
};

export default () => ({
	cmd: ["yta"],
	desc: "Download youtube audio",
	usage: "yta <youtube link>",
	handler,
});
