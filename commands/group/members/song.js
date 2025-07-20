const fs = require("fs");
const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");
const youtubedl = require("youtube-dl-exec");
const memoryManager = require("../../../functions/memoryUtils");
const { readFileEfficiently, isValidAudioFile } = require("../../../functions/fileUtils");
const {
	getYtDlpOptions,
	getYtdlCoreOptions,
	retryWithBackoff,
	isBotDetectionError,
	isYtdlCoreParsingError,
	delay,
	checkYtDlpBinary,
	isPyInstallerError,
} = require("../../../functions/youtubeUtils");

// Create multiple agents with different configurations to avoid bot detection
const agents = [ytdl.createAgent(), ytdl.createAgent(), ytdl.createAgent()];

let currentAgentIndex = 0;
const getNextAgent = () => {
	currentAgentIndex = (currentAgentIndex + 1) % agents.length;
	return agents[currentAgentIndex];
};

const getRandom = (ext) => {
	return memoryManager.generateTempFileName(ext);
};

const findSongURL = async (name) => {
	try {
		const r = await yts(`${name}`);
		if (!r.all || r.all.length === 0) {
			throw new Error("No results found");
		}
		return r.all[0].url;
	} catch (error) {
		console.error("Search error:", error);
		throw new Error("Failed to search for song");
	}
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { evv, command, sendMessageWTyping } = msgInfoObj;

	if (!args[0]) return sendMessageWTyping(from, { text: `❌ *Enter song name*` }, { quoted: msg });

	// Send initial processing message
	await sendMessageWTyping(from, { text: `🔍 Searching for: *${evv}*...` }, { quoted: msg });

	console.log("Song request:", evv);

	let URL;
	let fileDown = getRandom(".mp3");
	let title = "Unknown Song";

	try {
		// First try to find the song URL
		try {
			URL = await findSongURL(evv);
			console.log("Found URL:", URL);
		} catch (searchError) {
			console.error("Search failed:", searchError);
			return sendMessageWTyping(from, { text: `❌ No songs found for: *${evv}*` }, { quoted: msg });
		}

		// Try to get song info using youtube-dl-exec first (more reliable)
		await sendMessageWTyping(from, { text: `⏳ Downloading audio...` }, { quoted: msg });

		// Set timeout for download (5 minutes)
		const downloadTimeout = setTimeout(() => {
			console.log("Download timeout reached");
			memoryManager.safeUnlink(fileDown);
		}, 300000); // 5 minutes

		// Check if yt-dlp binary is working before attempting to use it
		let useYtdlp = await checkYtDlpBinary();
		console.log("yt-dlp binary available:", useYtdlp);

		// Use yt-dlp as primary method (most reliable against bot detection)
		if (useYtdlp) {
			try {
				console.log("Attempting download with yt-dlp...");

				const ytdlpOptions = getYtDlpOptions({
					format: "bestaudio[ext=m4a]/bestaudio/best[height<=480]",
					output: fileDown,
					extractAudio: true,
					audioFormat: "mp3",
					audioQuality: 0,
					maxFilesize: "50M",
				});

				await retryWithBackoff(
					async () => {
						await youtubedl(URL, ytdlpOptions);
					},
					3,
					2000
				);

				// Get title from yt-dlp info
				const info = await retryWithBackoff(
					async () => {
						return await youtubedl(
							URL,
							getYtDlpOptions({
								dumpSingleJson: true,
								noDownload: true,
							})
						);
					},
					2,
					1000
				);

				title = info.title || "Unknown Song";
			} catch (youtubeDlError) {
				console.error("yt-dlp failed:", youtubeDlError);

				// Check if it's a PyInstaller/binary error
				if (isPyInstallerError(youtubeDlError)) {
					console.log("PyInstaller error detected, disabling yt-dlp for this session");
					useYtdlp = false;
				} else if (isBotDetectionError(youtubeDlError)) {
					throw new Error("YouTube is currently blocking requests. Please try again in a few minutes.");
				} else {
					// For other yt-dlp errors, fall back to ytdl-core
					useYtdlp = false;
				}
			}
		}

		// Use ytdl-core if yt-dlp is not available or failed
		if (!useYtdlp) {
			// Fallback to ytdl with rotating agents and retry logic
			await sendMessageWTyping(from, { text: `🔄 Using alternative download method...` }, { quoted: msg });

			try {
				await retryWithBackoff(
					async () => {
						const currentAgent = getNextAgent();
						console.log(`Attempting ytdl with agent ${currentAgentIndex + 1}`);

						const ytdlOptions = getYtdlCoreOptions(currentAgent);

						const info = await ytdl.getBasicInfo(URL, ytdlOptions);
						title = info.videoDetails.title || "Unknown Song";

						const audioStream = ytdl(URL, {
							...ytdlOptions,
							quality: "highestaudio",
							filter: "audioonly",
							highWaterMark: 32 * 1024,
						});

						// Register stream for monitoring
						memoryManager.registerStream(audioStream);
						const writeStream = memoryManager.createOptimizedWriteStream(fileDown);
						audioStream.pipe(writeStream);

						await new Promise((resolve, reject) => {
							writeStream.on("finish", resolve);
							writeStream.on("error", reject);
							audioStream.on("error", reject);
						});
					},
					3,
					3000
				);
			} catch (ytdlError) {
				console.error("ytdl-core also failed:", ytdlError);
				
				if (isYtdlCoreParsingError(ytdlError)) {
					throw new Error("YouTube changed their format. Please try again later or contact support.");
				} else if (isBotDetectionError(ytdlError)) {
					throw new Error("YouTube is currently blocking requests. Please try again in a few minutes.");
				} else {
					throw new Error("All download methods failed. Please try again.");
				}
			}
		}

		// Clear the timeout since download completed
		clearTimeout(downloadTimeout);

		// Check if file was created and has content
		if (!fs.existsSync(fileDown)) {
			throw new Error("Audio file was not created");
		}

		// Validate the audio file
		if (!isValidAudioFile(fileDown)) {
			throw new Error("Invalid audio file generated");
		}

		const stats = fs.statSync(fileDown);
		const fileSizeMB = stats.size / 1024 / 1024;

		if (stats.size === 0) {
			throw new Error("Downloaded file is empty");
		}

		if (fileSizeMB > 50) {
			throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB (max 50MB)`);
		}

		console.log(`Audio ready: ${fileSizeMB.toFixed(2)}MB - ${title}`);

		// Send the audio file
		try {
			// Read file efficiently
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

			await sock.sendMessage(from, sock_data, { quoted: msg });
			console.log("Audio sent successfully");
		} catch (sendError) {
			console.error("Error sending audio:", sendError);
			throw new Error("Failed to send audio file");
		}
	} catch (err) {
		console.error("Song download error:", err);

		// Clear timeout on error
		if (typeof downloadTimeout !== "undefined") {
			clearTimeout(downloadTimeout);
		}

		// Send user-friendly error message
		let errorMsg = "❌ Download failed. ";
		if (err.message.includes("No songs found")) {
			errorMsg += "Try a different search term.";
		} else if (err.message.includes("too large")) {
			errorMsg += err.message;
		} else if (err.message.includes("restricted")) {
			errorMsg += "This song may be restricted or unavailable.";
		} else if (err.message.includes("extract functions")) {
			errorMsg += "YouTube is currently unavailable. Please try again later.";
		} else if (err.message.includes("blocking requests") || isBotDetectionError(err)) {
			errorMsg += "YouTube is blocking requests. Please try again in a few minutes.";
		} else if (err.message.includes("YouTube changed their format") || isYtdlCoreParsingError(err)) {
			errorMsg += "YouTube updated their system. Please try again later or contact support.";
		} else {
			errorMsg += "Please try again with a different song.";
		}

		await sendMessageWTyping(from, { text: errorMsg }, { quoted: msg });
	} finally {
		// Always cleanup the temp file
		memoryManager.safeUnlink(fileDown);
	}
};

module.exports.command = () => ({
	cmd: ["song", "play"],
	desc: "Download song",
	usage: "song | play | song [song name]",
	handler,
});
