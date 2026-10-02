import ffmpeg from "fluent-ffmpeg";
import { downloadMediaMessage } from "baileys";
import { writeFile, readFile } from "fs/promises";
import memoryManager from "../../../utils/memory.js";
import { getMediaFlags } from "../../../utils/mediaFlags.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { type, content, sendMessageWTyping, extendedMessageOriginal } = msgInfoObj;

	if (extendedMessageOriginal) {
		msg["message"] = extendedMessageOriginal.quotedMessage;
	}

	const { isMedia, isTaggedSticker } = getMediaFlags(type, content);

	const media = getRandom(".webp");

	if (isMedia || isTaggedSticker) {
		if (msg.message?.videoMessage?.seconds > 11) {
			return sendMessageWTyping(from, { text: "Send less then 11 seconds." }, { quoted: msg });
		}
		const buffer = await downloadMediaMessage(msg, "buffer", {});
		await writeFile(media, buffer);
		await sendImage(media);
	} else {
		sendMessageWTyping(from, { text: `❌ *Reply to sticker only*` }, { quoted: msg });
		console.error("Error not replied");
	}
	async function sendImage(media) {
		const ran = getRandom(".png");
		try {
			const file = ffmpeg(media).fromFormat("webp_pipe").save(ran);
			file.on("error", (err) => {
				console.log(err);
				sendMessageWTyping(
					from,
					{ text: "❌ There is some problem!\nOnly non-animated stickers can be convert to image!" },
					{ quoted: msg }
				);
				memoryManager.safeUnlink(media);
				memoryManager.safeUnlink(ran);
			}).on("end", async () => {
				// Read into a buffer before sending: sendMessageWTyping enqueues to BullMQ
				// and returns before the worker consumes it, so deleting the temp file by
				// path would race the worker ("File not found"). Buffer stays in memory.
				try {
					const imageBuffer = await readFile(ran);
					await sendMessageWTyping(
						from,
						{
							image: imageBuffer,
							caption: "Sent by eva",
							mimetype: "image/png",
						},
						{ quoted: msg }
					);
				} catch (err) {
					console.log(err);
				} finally {
					memoryManager.safeUnlink(media);
					memoryManager.safeUnlink(ran);
				}
			});
		} catch (err) {
			sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			console.log(err);
		}
	}
};

export default () => ({
	cmd: ["image", "toimg"],
	desc: "Convert a sticker back into an image.",
	usage: "image | reply to a sticker",
	handler,
});
