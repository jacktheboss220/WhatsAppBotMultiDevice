import { getMemberData } from "../../db/members.js";
import { downloadContentFromMessage } from "baileys";
import WSF from "wa-sticker-formatter";
import nodeWebpmux from "node-webpmux";
const { Image: WebpImage } = nodeWebpmux;

import fs from "fs";
import os from "os";
import path from "path";
const getRandom = (ext) => path.join(os.tmpdir(), `${Math.floor(Math.random() * 10000)}${ext}`);

async function addExifNodeWebpmux(buffer, pack, author) {
	const json = JSON.stringify({
		"sticker-pack-id": `${pack || ""}${author || ""}`.replace(/\s/g, ""),
		"sticker-pack-name": pack || "",
		"sticker-pack-publisher": author || "",
		"android-app-store-link": "",
		"ios-app-store-link": "",
	});
	const jsonBytes = Buffer.from(json, "utf-8");
	// TIFF header + 1 IFD entry (tag 0x4157, type UNDEFINED, offset 0x16)
	const header = Buffer.from([
		0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
		0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
	]);
	header.writeUIntLE(jsonBytes.length, 14, 4);
	const exif = Buffer.concat([header, jsonBytes]);

	const img = new WebpImage();
	await img.load(buffer);
	img.exif = exif;
	return await img.save(null); // returns Buffer, no disk I/O
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { evv, type, content, sendMessageWTyping, senderJid, command, extendedMessageOriginal } = msgInfoObj;
	const memberData = await getMemberData(senderJid);

	if (type === "extendedTextMessage" && content.includes("stickerMessage")) {
		let packName = "eva";
		let authorName = "jacktheboss220";
		if (args.includes("pack")) packName = args.join(" ").split("pack ")[1].split("author")[0];
		if (args.includes("author")) authorName = args.join(" ").split("author ")[1].split("pack")[0];

		const downloadFilePath = extendedMessageOriginal?.quotedMessage?.stickerMessage;
		const stream = await downloadContentFromMessage(downloadFilePath, "sticker");
		const chunks = [];
		for await (const chunk of stream) chunks.push(chunk);
		const buffer = Buffer.concat(chunks);

		const media = getRandom(".webp");
		await fs.promises.writeFile(media, buffer);

		const packOrAuthor = args.includes("pack") || args.includes("author");

		try {
			const webpWithMetadata =
				command === "stealn"
					? await WSF.setMetadata(undefined, undefined, media)
					: await WSF.setMetadata(
							packOrAuthor ? packName : evv ? evv : memberData?.customStealText || "eva",
							packOrAuthor
								? authorName
								: evv
								? ""
								: memberData?.customStealText
								? undefined
								: "jacktheboss220",
							media,
					  );
			await sendMessageWTyping(from, { sticker: Buffer.from(webpWithMetadata) }, { quoted: msg });
		} catch (error) {
			// webpmux fails on animated/lossless WebP — retry with node-webpmux (pure JS/Wasm)
			try {
				const finalPack = packOrAuthor ? packName : evv || memberData?.customStealText || "eva";
				const finalAuthor = packOrAuthor
					? authorName
					: evv ? "" : memberData?.customStealText ? undefined : "jacktheboss220";
				const stickerBuf = command === "stealn"
					? buffer
					: await addExifNodeWebpmux(buffer, finalPack, finalAuthor);
				await sendMessageWTyping(from, { sticker: stickerBuf }, { quoted: msg });
			} catch (err2) {
				await sendMessageWTyping(from, { sticker: buffer }, { quoted: msg });
			}
		} finally {
			fs.promises.unlink(media).catch(() => {});
		}
	} else {
		return sendMessageWTyping(from, { text: `❌ *Reply on Sticker*` }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["steal", "stealn"],
	desc: "Steal stickers with custom pack and author names or default ones.",
	usage: "steal | steal pack <name> author <name>",
	handler,
});
