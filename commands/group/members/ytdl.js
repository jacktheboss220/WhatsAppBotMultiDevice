const fs = require("fs");
const yts = require("yt-search");
const memoryManager = require("../../../functions/memoryUtils");
const { readFileEfficiently, isValidVideoFile } = require("../../../functions/fileUtils");
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
//-------------------------------------------------------------------------------------------------------------//

const cp = require("child_process");
const readline = require("readline");
// External modules
const ffmpeg = require("ffmpeg-static");
const youtubedl = require("youtube-dl-exec");
// Global constants
const ytdl = require("@distube/ytdl-core");
const path = require("path");

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

const findVideoURL = async (name) => {
	const r = await yts(`${name}`);
	return r.all[0].url + "&bpctr=9999999999&has_verified=1";
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, command, evv } = msgInfoObj;

	// Validate input
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
			if (!URL) {
				return sendMessageWTyping(from, { text: `❌ No video found for: ${evv}` }, { quoted: msg });
			}
		} catch (searchError) {
			console.error("Video search error:", searchError);
			return sendMessageWTyping(from, { text: `❌ Search failed. Please try again.` }, { quoted: msg });
		}
	} else {
		URL = args[0];
	}

	let fileDown = getRandom(".mp4");
	let ffmpegProcess = null;
	let progressBarHandle = null;

	try {
		// Send initial message
		await sendMessageWTyping(from, { text: `⏳ Processing video... Please wait.` }, { quoted: msg });

		let title = "Unknown Video";
		let videoInfo;
		let duration;

		// Check if yt-dlp binary is working before attempting to use it
		let useYtdlp = await checkYtDlpBinary();
		console.log("yt-dlp binary available:", useYtdlp);

		// Try to get video info using yt-dlp first (more reliable)
		if (useYtdlp) {
			try {
				console.log("Getting video info with yt-dlp...");
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
					1500
				);

				title = info.title || "Unknown Video";
				duration = info.duration || 0;
			} catch (infoError) {
				console.log("yt-dlp info failed:", infoError);

				// Check if it's a PyInstaller/binary error
				if (isPyInstallerError(infoError)) {
					console.log("PyInstaller error detected, disabling yt-dlp for this session");
					useYtdlp = false;
				} else if (isBotDetectionError(infoError)) {
					throw new Error("YouTube is currently blocking requests. Please try again in a few minutes.");
				} else {
					// For other yt-dlp errors, fall back to ytdl-core
					useYtdlp = false;
				}
			}
		}

		// Use ytdl-core if yt-dlp is not available or failed
		if (!useYtdlp) {
			console.log("Using ytdl-core for video info...");
			// Fallback to ytdl-core with retry logic
			try {
				await retryWithBackoff(
					async () => {
						const currentAgent = getNextAgent();
						const ytdlOptions = getYtdlCoreOptions(currentAgent);

						videoInfo = await ytdl.getBasicInfo(URL, ytdlOptions);
						title = videoInfo.videoDetails.title || "Unknown Video";
						duration = parseInt(videoInfo.videoDetails.lengthSeconds) || 0;
					},
					3,
					2000
				);
			} catch (ytdlInfoError) {
				console.error("ytdl-core info also failed:", ytdlInfoError);

				if (isYtdlCoreParsingError(ytdlInfoError)) {
					throw new Error("YouTube changed their format. Please try again later or contact support.");
				} else if (isBotDetectionError(ytdlInfoError)) {
					throw new Error("YouTube is currently blocking requests. Please try again in a few minutes.");
				} else {
					throw new Error("Unable to get video information. Please try again.");
				}
			}
		}

		// Validate video duration (optional limit to prevent huge downloads)
		if (duration > 1800) {
			// 30 minutes limit
			return sendMessageWTyping(
				from,
				{ text: `❌ Video is too long (${Math.round(duration / 60)} minutes). Maximum 30 minutes allowed.` },
				{ quoted: msg }
			);
		}

		console.log("Processing:", title, URL);

		const tracker = {
			start: Date.now(),
			audio: { downloaded: 0, total: Infinity },
			video: { downloaded: 0, total: Infinity },
			merged: { frame: 0, speed: "0x", fps: 0 },
		};

		// Try yt-dlp first as it's more reliable against bot detection
		let audio, video;

		if (useYtdlp) {
			try {
				console.log("Attempting to use yt-dlp for download...");
				// Use yt-dlp to download both audio and video separately
				const audioFile = getRandom("_audio.m4a");
				const videoFile = getRandom("_video.mp4");

				// Download audio with retry logic
				await retryWithBackoff(
					async () => {
						await youtubedl(
							URL,
							getYtDlpOptions({
								format: "bestaudio[ext=m4a]/bestaudio",
								output: audioFile,
							})
						);
					},
					3,
					2000
				);
				console.log("Audio download complete, checking file:", audioFile);
				if (!fs.existsSync(audioFile)) {
					await sendMessageWTyping(from, { text: "❌ Audio file was not created." }, { quoted: msg });
					console.error("Audio file not found:", audioFile);
					return;
				}
				const audioStats = fs.statSync(audioFile);
				if (audioStats.size === 0) {
					await sendMessageWTyping(from, { text: "❌ Audio file is empty." }, { quoted: msg });
					console.error("Audio file is empty:", audioFile);
					return;
				}

				// Download video with retry logic
				await retryWithBackoff(
					async () => {
						await youtubedl(
							URL,
							getYtDlpOptions({
								format: "bestvideo[ext=mp4]/bestvideo",
								output: videoFile,
							})
						);
					},
					3,
					2000
				);
				console.log("Video download complete, checking file:", videoFile);
				if (!fs.existsSync(videoFile)) {
					await sendMessageWTyping(from, { text: "❌ Video file was not created." }, { quoted: msg });
					console.error("Video file not found:", videoFile);
					return;
				}
				const videoStats = fs.statSync(videoFile);
				if (videoStats.size === 0) {
					await sendMessageWTyping(from, { text: "❌ Video file is empty." }, { quoted: msg });
					console.error("Video file is empty:", videoFile);
					return;
				}

				// Merge using ffmpeg
				console.log("Merging audio and video with ffmpeg...");
				const mergeProcess = cp.spawn(
					ffmpeg,
					[
						"-i",
						audioFile,
						"-i",
						videoFile,
						"-c:v",
						"copy",
						"-c:a",
						"aac",
						"-strict",
						"experimental",
						fileDown,
					],
					{ windowsHide: true }
				);

				await new Promise((resolve, reject) => {
					mergeProcess.on("close", (code) => {
						// Cleanup temp files
						memoryManager.safeUnlink(audioFile);
						memoryManager.safeUnlink(videoFile);
						console.log("ffmpeg merge process closed with code:", code);
						if (code === 0) {
							resolve();
						} else {
							reject(new Error(`FFmpeg merge failed with code ${code}`));
						}
					});
					mergeProcess.on("error", (err) => {
						console.error("ffmpeg merge process error:", err);
						reject(err);
					});
				});
				console.log("ffmpeg merge complete, checking output file:", fileDown);
				if (!fs.existsSync(fileDown)) {
					await sendMessageWTyping(from, { text: "❌ Merged video file was not created." }, { quoted: msg });
					return;
				}
				const mergedStats = fs.statSync(fileDown);
				if (mergedStats.size === 0) {
					await sendMessageWTyping(from, { text: "❌ Merged video file is empty." }, { quoted: msg });
					return;
				}
				if (!isValidVideoFile(fileDown)) {
					await sendMessageWTyping(
						from,
						{ text: "❌ Video file is not valid or not supported." },
						{ quoted: msg }
					);
					return;
				}
				const fileSizeMB = mergedStats.size / (1024 * 1024);
				if (fileSizeMB > 60) {
					await sendMessageWTyping(
						from,
						{
							text: `❌ Video is too large to send on WhatsApp (${fileSizeMB.toFixed(
								2
							)}MB). Limit is 60MB.`,
						},
						{ quoted: msg }
					);
					memoryManager.safeUnlink(fileDown);
					return;
				}
				// Normalize file path for WhatsApp library
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
					try {
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
					} catch (sendBufferError) {
						await sendMessageWTyping(
							from,
							{
								text: `❌ Failed to send video: ${sendBufferError.message}`,
							},
							{ quoted: msg }
						);
					}
				} finally {
					memoryManager.safeUnlink(fileDown);
				}
			} catch (ytdlpError) {
				console.error("yt-dlp failed, falling back to ytdl-core:", ytdlpError);

				// Check if it's a PyInstaller/binary error
				if (isPyInstallerError(ytdlpError)) {
					console.log("PyInstaller error detected, disabling yt-dlp for this session");
					useYtdlp = false;
				} else if (isBotDetectionError(ytdlpError)) {
					throw new Error("YouTube is currently blocking requests. Please try again in a few minutes.");
				} else {
					// For other yt-dlp errors, fall back to ytdl-core
					useYtdlp = false;
				}
			}
		}

		if (!useYtdlp) {
			console.log("Using ytdl-core with enhanced anti-bot measures...");

			// Enhanced ytdl-core implementation with retry logic
			try {
				await retryWithBackoff(
					async () => {
						const currentAgent = getNextAgent();
						const ytdlOptions = getYtdlCoreOptions(currentAgent);

						// Get audio and video streams with memory management
						audio = ytdl(URL, {
							...ytdlOptions,
							quality: "highestaudio",
							highWaterMark: 32 * 1024,
						})
							.on("progress", (_, downloaded, total) => {
								tracker.audio = { downloaded, total };
							})
							.on("error", (err) => {
								console.log("Audio stream error:", err);
								memoryManager.safeUnlink(fileDown);
							});

						video = ytdl(URL, {
							...ytdlOptions,
							quality: "highestvideo",
							highWaterMark: 32 * 1024,
						})
							.on("progress", (_, downloaded, total) => {
								tracker.video = { downloaded, total };
							})
							.on("error", (err) => {
								console.log("Video stream error:", err);
								memoryManager.safeUnlink(fileDown);
							});

						// Register streams for monitoring
						memoryManager.registerStream(audio);
						memoryManager.registerStream(video);
					},
					3,
					3000
				);
			} catch (ytdlStreamError) {
				console.error("ytdl-core stream creation failed:", ytdlStreamError);

				if (isYtdlCoreParsingError(ytdlStreamError)) {
					throw new Error("YouTube changed their format. Please try again later or contact support.");
				} else if (isBotDetectionError(ytdlStreamError)) {
					throw new Error("YouTube is currently blocking requests. Please try again in a few minutes.");
				} else {
					throw new Error("Video download failed. All methods exhausted.");
				}
			}

			// Prepare the progress bar
			progressBarHandle = null;
			const progressBarInterval = 1000;

			const showProgress = () => {
				readline.cursorTo(process.stdout, 0);
				const toMB = (i) => (i / 1024 / 1024).toFixed(2);
				console.log("ToMB:", toMB(tracker.audio.downloaded), toMB(tracker.audio.total));

				process.stdout.write(
					`Audio  | ${((tracker.audio.downloaded / tracker.audio.total) * 100).toFixed(2)}% processed `
				);
				process.stdout.write(
					`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${" ".repeat(10)}\n`
				);

				process.stdout.write(
					`Video  | ${((tracker.video.downloaded / tracker.video.total) * 100).toFixed(2)}% processed `
				);
				process.stdout.write(
					`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${" ".repeat(10)}\n`
				);

				process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
				process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${" ".repeat(10)}\n`);

				process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
				readline.moveCursor(process.stdout, 0, -3);
			};

			// Start the ffmpeg child process
			ffmpegProcess = cp.spawn(
				ffmpeg,
				[
					// Remove ffmpeg's console spamming
					"-loglevel",
					"8",
					"-hide_banner",
					// Redirect/Enable progress messages
					"-progress",
					"pipe:3",
					// Set inputs
					"-i",
					"pipe:4",
					"-i",
					"pipe:5",
					// Map audio & video from streams
					"-map",
					"0:a",
					"-map",
					"1:v",
					// Keep encoding
					"-c:v",
					"copy",
					// Define output file
					fileDown,
				],
				{
					windowsHide: true,
					stdio: [
						/* Standard: stdin, stdout, stderr */
						"inherit",
						"inherit",
						"inherit",
						/* Custom: pipe:3, pipe:4, pipe:5 */
						"pipe",
						"pipe",
						"pipe",
					],
				}
			);

			// Add timeout for the entire process (10 minutes)
			const processTimeout = setTimeout(() => {
				console.log("Process timeout reached, killing FFmpeg");
				if (ffmpegProcess && !ffmpegProcess.killed) {
					ffmpegProcess.kill("SIGTERM");
				}
				if (progressBarHandle) {
					clearInterval(progressBarHandle);
				}
				memoryManager.safeUnlink(fileDown);
				sendMessageWTyping(
					from,
					{ text: `⏱️ Download timeout. Video might be too large or network is slow.` },
					{ quoted: msg }
				);
			}, 600000); // 10 minutes

			ffmpegProcess.on("close", async () => {
				console.log("FFmpeg processing completed");
				clearTimeout(processTimeout); // Clear timeout on successful completion
				// Cleanup
				process.stdout.write("\n\n\n\n");
				if (progressBarHandle) {
					clearInterval(progressBarHandle);
				}

				try {
					// Check file existence and size before sending
					if (!fs.existsSync(fileDown)) {
						await sendMessageWTyping(from, { text: "❌ Video file was not created." }, { quoted: msg });
						console.error("File not found:", fileDown);
						return;
					}
					const stats = fs.statSync(fileDown);
					if (stats.size === 0) {
						try {
							await sendMessageWTyping(from, { text: "❌ Video file is empty." }, { quoted: msg });
						} catch (err) {
							console.error("Error sending empty file message:", err);
						}
						console.error("File is empty:", fileDown);
						return;
					}
					if (!isValidVideoFile(fileDown)) {
						try {
							await sendMessageWTyping(
								from,
								{ text: "❌ Video file is not valid or not supported." },
								{ quoted: msg }
							);
						} catch (err) {
							console.error("Error sending invalid file message:", err);
						}
						console.error("Invalid video file:", fileDown);
						return;
					}
					const fileSizeMB = stats.size / (1024 * 1024);
					console.log("Attempting to send video file:", fileDown, "Size:", fileSizeMB.toFixed(2), "MB");
					if (fileSizeMB > 60) {
						// WhatsApp hard limit is usually 64MB, but use 60MB for safety
						try {
							await sendMessageWTyping(
								from,
								{
									text: `❌ Video is too large to send on WhatsApp (${fileSizeMB.toFixed(
										2
									)}MB). Limit is 60MB.`,
								},
								{ quoted: msg }
							);
						} catch (err) {
							console.error("Error sending file too large message:", err);
						}
						console.error("File too large for WhatsApp:", fileDown, fileSizeMB);
						memoryManager.safeUnlink(fileDown);
						return;
					}
					// Wait 2-3 seconds to ensure file system flush
					await new Promise((res) => setTimeout(res, 2500));
					// Normalize file path for WhatsApp library
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
						console.log("Video sent successfully");
						try {
							await sendMessageWTyping(from, { text: "✅ Video sent successfully." }, { quoted: msg });
						} catch (err) {
							console.error("Error sending success message:", err);
						}
					} catch (sendPathError) {
						console.error("File path send failed, trying buffer fallback:", sendPathError);
						try {
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
							console.log("Video sent with buffer fallback");
							try {
								await sendMessageWTyping(
									from,
									{ text: "✅ Video sent with buffer fallback." },
									{ quoted: msg }
								);
							} catch (err) {
								console.error("Error sending buffer fallback success message:", err);
							}
						} catch (sendBufferError) {
							console.error("Buffer fallback also failed:", sendBufferError);
							try {
								await sendMessageWTyping(
									from,
									{
										text: `❌ Failed to send video: ${sendBufferError.message}`,
									},
									{ quoted: msg }
								);
							} catch (err) {
								console.error("Error sending buffer fallback error message:", err);
							}
						}
					} finally {
						// Ensure cleanup happens
						memoryManager.safeUnlink(fileDown);
					}
				} catch (sendError) {
					console.error("Send error:", sendError);
					await sendMessageWTyping(
						from,
						{ text: `❌ Failed to send video: ${sendError.message}` },
						{ quoted: msg }
					);
				} finally {
					// Ensure cleanup happens
					memoryManager.safeUnlink(fileDown);
				}
			});

			ffmpegProcess.on("error", (err) => {
				console.error("FFmpeg error:", err);
				clearTimeout(processTimeout); // Clear timeout on error
				if (progressBarHandle) {
					clearInterval(progressBarHandle);
				}
				memoryManager.safeUnlink(fileDown); // Cleanup on error
				sendMessageWTyping(from, { text: `❌ Processing failed: ${err.message}` }, { quoted: msg });
			});

			ffmpegProcess.stdio[3].on("data", (chunk) => {
				// Start the progress bar
				if (!progressBarHandle) progressBarHandle = setInterval(showProgress, progressBarInterval);
				// Parse the param=value list returned by ffmpeg
				const lines = chunk.toString().trim().split("\n");
				const args = {};
				for (const l of lines) {
					const [key, value] = l.split("=");
					args[key.trim()] = value.trim();
				}
				tracker.merged = args;
			});

			audio.pipe(ffmpegProcess.stdio[4]);
			video.pipe(ffmpegProcess.stdio[5]);
		}
	} catch (err) {
		console.error("YTDL Handler Error:", err);

		// Cleanup on error
		if (progressBarHandle) {
			clearInterval(progressBarHandle);
		}
		if (ffmpegProcess && !ffmpegProcess.killed) {
			ffmpegProcess.kill("SIGTERM");
		}
		memoryManager.safeUnlink(fileDown);

		// Send user-friendly error message
		let errorMsg = "❌ Download failed. ";
		if (err.message.includes("Video unavailable")) {
			errorMsg += "Video is unavailable or private.";
		} else if (err.message.includes("age")) {
			errorMsg += "Age-restricted content not supported.";
		} else if (err.message.includes("network")) {
			errorMsg += "Network error, please try again.";
		} else if (err.message.includes("Sign in to confirm")) {
			errorMsg += "YouTube is blocking requests. Please try again later.";
		} else if (err.message.includes("bot")) {
			errorMsg += "Anti-bot protection detected. Please try again in a few minutes.";
		} else if (err.message.includes("restricted")) {
			errorMsg += "This video is restricted or geo-blocked.";
		} else if (isPyInstallerError(err)) {
			errorMsg += "Download system error. Please try again or contact support.";
		} else {
			errorMsg += "Please try with a different video.";
		}

		sendMessageWTyping(from, { text: errorMsg }, { quoted: msg });
	}
};

module.exports.command = () => ({
	cmd: ["yt", "ytv", "vs"],
	desc: "Download youtube video",
	usage: "yt <youtube link>",
	handler,
});
