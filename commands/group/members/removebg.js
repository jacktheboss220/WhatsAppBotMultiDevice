import dotenv from "dotenv";
dotenv.config();
const REMOVE_BG_KEY = process.env.REMOVE_BG_KEY || "";

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
const removebgAPI = REMOVE_BG_KEY;
import { writeFile } from "fs/promises";

import { downloadContentFromMessage } from "baileys";
import memoryManager from "../../../utils/memory.js";
import { getMediaFlags } from "../../../utils/mediaFlags.js";

const getRandom = (ext) => memoryManager.generateTempFileName(ext);

const getRemoveBg = async (Path, outputPath) => {
	const inputPath = Path;
	const formData = new FormData();
	formData.append("size", "auto");
	formData.append("image_file", fs.createReadStream(inputPath), path.basename(inputPath));
	const response = await axios({
		method: "post",
		url: "https://api.remove.bg/v1.0/removebg",
		data: formData,
		responseType: "arraybuffer",
		headers: {
			...formData.getHeaders(),
			"X-Api-Key": removebgAPI,
		},
		encoding: null,
		timeout: 20000,
	});
	await fs.promises.writeFile(outputPath, response.data);
	console.log("DONE");
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { type, content, sendMessageWTyping, extendedMessageOriginal } = msgInfoObj;

	if (!REMOVE_BG_KEY)
		return sendMessageWTyping(from, { text: "```Remove BG API Key is Missing```" }, { quoted: msg });

	const { isTaggedImage } = getMediaFlags(type, content);

	if (isTaggedImage || msg.message.imageMessage) {
		let downloadFilePath;
		if (msg.message.imageMessage) {
			downloadFilePath = msg.message.imageMessage;
		} else {
			downloadFilePath = extendedMessageOriginal?.quotedMessage?.imageMessage;
		}
		const stream = await downloadContentFromMessage(downloadFilePath, "image");
		let buffer = Buffer.from([]);
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk]);
		}
		const media = getRandom(".jpeg");
		await writeFile(media, buffer);
		const outputPath = getRandom(".png");
		try {
			await getRemoveBg(media, outputPath);
			try {
				await sendMessageWTyping(from, {
					image: await fs.promises.readFile(outputPath),
					mimetype: "image/png",
					caption: `*Sent by eva*`,
				}, { quoted: msg });
			} catch (err) {
				sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			} finally {
				memoryManager.safeUnlink(media);
				memoryManager.safeUnlink(outputPath);
			}
		} catch (err) {
			console.log("Status : ", err.status);
			sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			memoryManager.safeUnlink(media);
		}
	} else {
		sendMessageWTyping(from, { text: `*Reply to image only*` }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["removebg", "bg"],
	desc: "Remove the background from an image. Reply to the image.",
	usage: "removebg | reply to image",
	handler,
});
