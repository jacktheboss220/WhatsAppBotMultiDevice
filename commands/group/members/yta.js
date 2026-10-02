import fs from "fs";
import memoryManager from "../../../utils/memory.js";
import { readFileEfficiently } from "../../../utils/file.js";
import { youtubedl, ytdlpOpts, parseYouTubeUrl, downloadLimits } from "../../../utils/ytdlp.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	const url = args[0] && parseYouTubeUrl(args[0]);
	if (!url) {
		return sendMessageWTyping(from, { text: `❌ *Enter Youtube link*` }, { quoted: msg });
	}

	const fileDown = getRandom(".mp3");

	try {
		await youtubedl(
			url,
			await ytdlpOpts({
				format: "bestaudio/best",
				extractAudio: true,
				audioFormat: "mp3",
				audioQuality: 0,
				output: fileDown,
				...downloadLimits,
			})
		);

		if (!fs.existsSync(fileDown)) throw new Error("Audio file was not created"); // also what yt-dlp leaves when the length/size limit rejects it
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
		} else if (m.includes("not created")) {
			errorMsg += "Video is too long (max 30 min), too large (max 60MB) or live.";
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
	desc: "Download the audio of a YouTube video.",
	usage: "yta <youtube link>",
	handler,
});
