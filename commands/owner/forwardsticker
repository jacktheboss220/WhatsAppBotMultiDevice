const {
  downloadContentFromMessage,
  toBuffer,
} = require("@adiwajshing/baileys");
const { Exif } = require("wa-sticker-formatter");
const { LoggerTg } = require("./loggerBot");

let countSent = 0;
let countIn = 0,
  countErr = 0,
  sameSticker = 0;
let last20SentStickersSize = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

module.exports.forwardSticker = async (
  sendMessage,
  downloadFilePath,
  pvxstickeronly1,
  pvxstickeronly2
) => {
  try {
    const stickerSize = downloadFilePath.fileLength;
    if (last20SentStickersSize.includes(stickerSize)) {
      console.log("same sticker again.");
      sameSticker += 1;
      return false;
    }

    last20SentStickersSize.shift();
    last20SentStickersSize.push(stickerSize);
    countIn += 1;
    let stream = await downloadContentFromMessage(downloadFilePath, "sticker");

    let buffer = await toBuffer(stream);

    const webpWithExif = await new Exif({
      pack: "BOT 🤖",
      author: "pvxcommunity.com",
    }).add(buffer);

    // 1000*60*60*24 = 86400ms = 1 day
    await sendMessage(
      pvxstickeronly1,
      { sticker: webpWithExif },
      {
        mimetype: "sticker",
        ephemeralExpiration: 86400,
        mediaUploadTimeoutMs: 1000 * 30,
      }
    );
    await sendMessage(
      pvxstickeronly2,
      { sticker: webpWithExif },
      {
        mimetype: "sticker",
        ephemeralExpiration: 86400,
        mediaUploadTimeoutMs: 1000 * 30,
      }
    );

    countSent += 1;
    console.log(
      `${countSent} sticker sent! In:${countIn}, Err:${countErr}, Same: ${sameSticker}`
    );
    return true;
  } catch (err) {
    console.log(err);
    await LoggerTg(`ERROR: [FORWARD-STICKER]\n${err.toString()}`);
    countErr += 1;
    return false;
  }
};
