import fs from "fs";
import yts from "yt-search";
import memoryManager from "../../../utils/memory.js";
import { readFileEfficiently, isValidAudioFile } from "../../../utils/file.js";
import { youtubedl, ytdlpOpts, downloadLimits } from "../../../utils/ytdlp.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

const findSongURL = async (name) => {
	const r = await yts(`${name}`);
	if (!r.all || r.all.length === 0) throw new Error("No results found");
	return r.all[0].url;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { evv, command, sendMessageWTyping } = msgInfoObj;

	if (!args[0]) return sendMessageWTyping(from, { text: `❌ *Enter song name*` }, { quoted: msg });

	await sendMessageWTyping(from, { text: `🔍 Searching for: *${evv}*...` }, { quoted: msg });
	console.log("Song request:", evv);

	const fileDown = getRandom(".mp3");
	let title = "Unknown Song";

	try {
		let URL;
		try {
			URL = await findSongURL(evv);
			console.log("Found URL:", URL);
		} catch (searchError) {
			console.error("Search failed:", searchError);
			return sendMessageWTyping(from, { text: `❌ No songs found for: *${evv}*` }, { quoted: msg });
		}

		await sendMessageWTyping(from, { text: `⏳ Downloading audio...` }, { quoted: msg });

		// Title (best-effort) runs alongside the actual download instead of before it —
		// the two yt-dlp invocations are independent, no need to serialize them.
		const titlePromise = youtubedl(URL, await ytdlpOpts({ dumpSingleJson: true }))
			.then((info) => { title = info.title || "Unknown Song"; })
			.catch((e) => console.log("Title fetch failed:", e.message));

		// Download + extract to mp3 (yt-dlp uses ffmpeg-static)
		const downloadPromise = youtubedl(
			URL,
			await ytdlpOpts({
				format: "bestaudio/best",
				extractAudio: true,
				audioFormat: "mp3",
				audioQuality: 0,
				output: fileDown,
				...downloadLimits,
			})
		);

		await Promise.all([titlePromise, downloadPromise]);

		if (!fs.existsSync(fileDown)) throw new Error("Audio file was not created");
		if (!isValidAudioFile(fileDown)) throw new Error("Invalid audio file generated");

		const stats = await fs.promises.stat(fileDown);
		const fileSizeMB = stats.size / 1024 / 1024;
		if (stats.size === 0) throw new Error("Downloaded file is empty");
		if (fileSizeMB > 50) throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB (max 50MB)`);

		console.log(`Audio ready: ${fileSizeMB.toFixed(2)}MB - ${title}`);

		const audioBuffer = await readFileEfficiently(fileDown);
		let sock_data;
		if (command === "song") {
			sock_data = {
				document: audioBuffer,
				mimetype: "audio/mpeg",
				fileName: `${title}.mp3`,
				ptt: true,
				caption: `🎵 *${title}*\n📊 Size: ${fileSizeMB.toFixed(2)}MB`,
			};
		} else {
			sock_data = {
				audio: audioBuffer,
				mimetype: "audio/mpeg",
				fileName: `${title}.mp3`,
			};
		}

		await sendMessageWTyping(from, sock_data, { quoted: msg });
		console.log("Audio sent successfully");
	} catch (err) {
		console.error("Song download error:", err);
		const m = (err.message || "").toLowerCase();
		let errorMsg = "❌ Download failed. ";
		if (m.includes("sign in to confirm") || m.includes("bot")) {
			errorMsg += "YouTube is blocking this server. Set YTDLP_COOKIES to fix.";
		} else if (m.includes("age")) {
			errorMsg += "Age-restricted. Set YTDLP_COOKIES to download.";
		} else if (m.includes("not created")) {
			errorMsg += "That result is too long (max 30 min) or live. Try a more specific name.";
		} else if (m.includes("too large")) {
			errorMsg += err.message;
		} else {
			errorMsg += "Please try again with a different song.";
		}
		await sendMessageWTyping(from, { text: errorMsg }, { quoted: msg });
	} finally {
		memoryManager.safeUnlink(fileDown);
	}
};

export default () => ({
	cmd: ["song", "play"],
	desc: "Download a song by name.",
	usage: "song | play | song [song name]",
	handler,
});
