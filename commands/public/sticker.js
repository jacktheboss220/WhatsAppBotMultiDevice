const { downloadMediaMessage } = require("baileys");
const WSF = require("wa-sticker-formatter");
const memoryManager = require("../../functions/memoryUtils");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath);

const { getMemberData, member } = require("../../mongo-DB/membersDataDb");
const { writeFile } = require("fs/promises");
const fs = require("fs");

const getRandom = (ext = "") => memoryManager.generateTempFileName(ext);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { senderJid, type, content, isGroup, sendMessageWTyping, evv } = msgInfoObj;
	const memberData = await getMemberData(senderJid);

	if (msg.message.extendedTextMessage) {
		msg.message = msg.message.extendedTextMessage.contextInfo.quotedMessage;
	}

	const isMedia = type === "imageMessage" || type === "videoMessage";
	const isTaggedImage = type === "extendedTextMessage" && content.includes("imageMessage");
	const isTaggedVideo = type === "extendedTextMessage" && content.includes("videoMessage");

	if (!isGroup) {
		if (memberData.dmLimit <= 0) {
			return sendMessageWTyping(
				from,
				{ text: "You have used your monthly limit.\nWait for next month." },
				{ quoted: msg }
			);
		}
		member.updateOne({ _id: senderJid }, { $inc: { dmLimit: -1 } });
	}

	let packName = memberData ? await memberData?.customStealText : "eva";
	let authorName = memberData?.customStealText ? undefined : "eva";

	const isPackIncluded = args.includes("pack");
	const isAuthorIncluded = args.includes("author");

	if (args.includes("nometadata") === false) {
		packName = isPackIncluded ? evv.split("pack")[1].split("author")[0] : packName;
		authorName = isAuthorIncluded ? evv.split("author")[1].split("pack")[0] : authorName;
	}

	const outputOptions =
		args.includes("crop") || args.includes("c")
			? [
					`-vcodec`,
					`libwebp`,
					`-vf`,
					`crop=w='min(min(iw\,ih)\,500)':h='min(min(iw\,ih)\,500)',scale=500:500,setsar=1,fps=15`,
					`-loop`,
					`0`,
					`-ss`,
					`00:00:00.0`,
					`-t`,
					`00:00:09.0`,
					`-preset`,
					`default`,
					`-an`,
					`-vsync`,
					`0`,
					`-s`,
					`512:512`,
			  ]
			: [
					`-vcodec`,
					`libwebp`,
					`-vf`,
					`scale='min(220,iw)':min'(220,ih)':force_original_aspect_ratio=decrease,fps=15, pad=220:220:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
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
					{ text: "❎ Failed to download media. Please try again." },
					{ quoted: msg }
				);
			}

			await writeFile(media, buffer);

			// Verify file was written successfully
			if (!fs.existsSync(media)) {
				return sendMessageWTyping(
					from,
					{ text: "❎ Failed to save media file. Please try again." },
					{ quoted: msg }
				);
			}

			await buildSticker(media);
		} catch (error) {
			console.error("Media download error:", error);
			// Clean up any partial file
			memoryManager.safeUnlink(media);
			return sendMessageWTyping(from, { text: "❎ Failed to process media. Please try again." }, { quoted: msg });
		}
	} else {
		sendMessageWTyping(from, { text: `❎ *Error reply to image or video only*` }, { quoted: msg });
		console.error("Error not replied");
	}

	async function buildSticker(media) {
		const ran = getRandom(".webp");

		try {
			// Verify input file exists before processing
			if (!fs.existsSync(media)) {
				throw new Error("Input media file not found");
			}

			const file = ffmpeg(media)
				.on("error", (err) => {
					console.error("FFmpeg error:", err);
					memoryManager.safeUnlink(media);
					memoryManager.safeUnlink(ran);
					sendMessageWTyping(from, { text: "❎ Error converting media to sticker." }, { quoted: msg });
				})
				.addOutputOptions(outputOptions)
				.toFormat("webp")
				.save(ran);

			file.on("end", async () => {
				try {
					// Verify output file was created
					if (!fs.existsSync(ran)) {
						throw new Error("Output sticker file not created");
					}

					const stickerBuffer = await WSF.setMetadata(packName, authorName, ran);
					// Use sendMessageWTyping with file path for async/efficient sending
					await sendMessageWTyping(from, { sticker: ran }, { quoted: msg });
				} catch (wsError) {
					console.error("Sticker creation error:", wsError);
					// Fallback to file reading if buffer method fails
					try {
						if (fs.existsSync(ran)) {
							await sendMessageWTyping(from, { sticker: ran }, { quoted: msg });
						} else {
							throw new Error("No sticker file to send");
						}
					} catch (fallbackError) {
						console.error("Fallback error:", fallbackError);
						sendMessageWTyping(from, { text: "❎ Failed to create sticker." }, { quoted: msg });
					}
				} finally {
					// Ensure cleanup happens
					memoryManager.safeUnlink(media);
					memoryManager.safeUnlink(ran);
				}
			});
		} catch (err) {
			console.error("buildSticker error:", err);
			sendMessageWTyping(from, { text: `❎ Error: ${err.message}` }, { quoted: msg });
			memoryManager.safeUnlink(media);
			memoryManager.safeUnlink(ran);
		}
	}
};

module.exports.command = () => ({
	cmd: ["sticker", "s"],
	desc: "Convert image or video to sticker",
	usage: "sticker | s | reply to image or video | pack | author | nometadata",
	handler,
});
