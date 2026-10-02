import { downloadMediaMessage } from "baileys";

import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { writeFile } from "fs/promises";
import memoryManager from "../../../utils/memory.js";
import { getMediaFlags } from "../../../utils/mediaFlags.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { type, content, sendMessageWTyping, extendedMessageOriginal } = msgInfoObj;

	if (extendedMessageOriginal) {
		msg["message"] = extendedMessageOriginal.quotedMessage;
	}

	const { isMedia, isTaggedImage, isTaggedVideo } = getMediaFlags(type, content);

	if (isMedia || isTaggedImage || isTaggedVideo) {
		const media = getRandom(".mp4");
		const path = getRandom(".mp3");
		const buffer = await downloadMediaMessage(msg, "buffer", {});
		await writeFile(media, buffer);

		ffmpeg()
			.input(media)
			.audioCodec("libmp3lame")
			.audioBitrate("320k")
			.noVideo()
			.outputOptions(["-preset ultrafast"])
			.on("end", async () => {
				console.log("Conversion finished");
				try {
					await sendMessageWTyping(
						from,
						{
							audio: await fs.promises.readFile(path),
							mimetype: "audio/mpeg",
							fileName: "audio.mp3", // was the server temp path
						},
						{ quoted: msg }
					);
				} finally {
					memoryManager.safeUnlink(media);
					memoryManager.safeUnlink(path);
				}
			})
			.on("error", (err) => {
				console.error("Error:", err);
				sendMessageWTyping(from, { text: `Error while converting` }, { quoted: msg });
				memoryManager.safeUnlink(media);
				memoryManager.safeUnlink(path);
			})
			.save(path);
	} else {
		console.log("No Media tag");
		sendMessageWTyping(from, { text: `*Reply to video only*` }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["mp3", "mp4audio", "tomp3"],
	desc: "Convert a video to an MP3. Reply to the video.",
	usage: "mp3 | reply to video",
	handler,
});
