import { getMemberData } from "../../mongo-DB/membersDataDb.js";
import { downloadContentFromMessage } from "baileys";
import WSF from "wa-sticker-formatter";

import fs from "fs";
const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { evv, type, content, sendMessageWTyping, senderJid, command } = msgInfoObj;
	const memberData = await getMemberData(senderJid);

	if (type === "extendedTextMessage" && content.includes("stickerMessage")) {
		let packName = "eva";
		let authorName = "jacktheboss220";
		if (args.includes("pack")) packName = args.join(" ").split("pack ")[1].split("author")[0];

		if (args.includes("author")) authorName = args.join(" ").split("author ")[1].split("pack")[0];

		const downloadFilePath = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
		const stream = await downloadContentFromMessage(downloadFilePath, "sticker");
		let buffer = Buffer.from([]);
		for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

		const media = getRandom(".webp");
		fs.writeFileSync(media, buffer);

		const packOrAuthor = args.includes("pack") || args.includes("author");

		let webpWithMetadata;
		try {
			webpWithMetadata =
				command == "stealn"
					? await WSF.setMetadata(undefined, undefined, media)
					: await WSF.setMetadata(
							packOrAuthor ? packName : evv ? evv : memberData.customStealText || "eva",
							packOrAuthor
								? authorName
								: evv
								? ""
								: memberData.customStealText
								? undefined
								: "jacktheboss220",
							media
					  );
			await sock.sendMessage(from, { sticker: Buffer.from(webpWithMetadata) }, { quoted: msg });
		} catch (error) {
			console.error("Error setting metadata:", error);
			return sendMessageWTyping(from, { text: `❌ *Error setting metadata*` }, { quoted: msg });
		}

		fs.unlinkSync(media);
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
