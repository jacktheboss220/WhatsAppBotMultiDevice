import { downloadMediaMessage, proto } from "baileys";
import WSF from "wa-sticker-formatter";

import fs from "fs";
const getRandom = (ext) => {
	return `${Math.floor(Math.random() * 10000)}${ext}`;
};

const forwardGroup = ""; // Group ID
// const forwardGroup = "120363419598823083@newsletter"; // Group ID

const ignoreGroup = ["", ""]; // Group ID with commas

const stickerLengthArray = [];

const stickerForward = async (sock, msg, from) => {
	if (!forwardGroup || ignoreGroup.includes(from) || from === forwardGroup) return;

	if (msg.message.extendedTextMessage) {
		msg["message"] = msg.message.extendedTextMessage.contextInfo.quotedMessage;
	}

	console.log("Message:", msg.message);

	// let packName = "eva";
	// let authorName = undefined;

	// const media = getRandom(".webp");
	// const buffer = await downloadMediaMessage(msg, "buffer", {});
	// fs.writeFileSync(media, buffer);

	const messageToChannel = proto.Message.encode({
		stickerMessage: {
			url: msg.message.stickerMessage.url,
			fileSha256: msg.message.stickerMessage.fileSha256,
			fileLength: msg.message.stickerMessage.fileLength,
			mimetype: msg.message.stickerMessage.mimetype,
			height: msg.message.stickerMessage.height,
			width: msg.message.stickerMessage.width,
			mediaKey: msg.message.stickerMessage.mediaKey,
			type: 4,
		},
	}).finish();

	const plaintextNode = {
		tag: "message",
		attrs: {
			to: forwardGroup,
			type: "text",
		},
		content: [
			{
				tag: "sticker",
				attrs: {},
				content: messageToChannel,
			},
		],
	};

	console.log("Sending sticker to group:", JSON.stringify(plaintextNode, null, 2));

	await sock.query(plaintextNode).then(async (result) => {
		console.error(result);
	});

	return;

	fs.stat(media, async (err, stats) => {
		if (err) return;
		const fileSizeInBytes = stats.size;
		const fileSizeInKB = fileSizeInBytes / 1024;
		const fileSizeInMB = fileSizeInKB / 1024;
		if (stickerLengthArray.length > 5) stickerLengthArray.shift();
		if (stickerLengthArray.includes(fileSizeInMB)) return fs.unlinkSync(media);
		else {
			try {
				const webpWithMetadata = await WSF.setMetadata(packName, authorName, media);
				await sock.sendMessage(forwardGroup, { sticker: Buffer.from(webpWithMetadata) });
				fs.unlinkSync(media);
			} catch (e) {
				const { Sticker, StickerTypes } = require("wa-sticker-formatter-1");
				const sticker_buffer = await new Sticker(media)
					.setPack(packName)
					.setAuthor(authorName)
					.setType(StickerTypes.FULL)
					.setQuality(80)
					.toBuffer();

				await sock.sendMessage(forwardGroup, { sticker: sticker_buffer });
				fs.unlinkSync(media);
			}
			stickerLengthArray.push(fileSizeInMB);
		}
	});
};

export { stickerForward, forwardGroup };
