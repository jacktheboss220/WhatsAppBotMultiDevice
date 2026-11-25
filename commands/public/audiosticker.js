import { downloadMediaMessage, normalizeMessageContent } from "baileys";
import { readFile, writeFile } from "fs/promises";
import memoryManager from "../../utils/memory.js";
import { probe, sendAudioSticker, toOpus, toWebp } from "../../utils/audioSticker.js";

const MAX_SECONDS = 30;
const MAX_SOURCE_SECONDS = 60;

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping, extendedMessageOriginal: ctx } = msgInfoObj;
  const reply = (text) => sendMessageWTyping(from, { text }, { quoted: msg });

  // Same as sticker.js: download the quoted message as if it were the command message.
  const target = ctx?.quotedMessage ? { ...msg, message: ctx.quotedMessage } : msg;
  const video = normalizeMessageContent(target.message)?.videoMessage;
  if (!video || video.gifPlayback) {
    return reply("🔊 Reply `*as` to a *video with sound* (or send one with `*as` as caption). `*as 7` sets length (1-30s). `*as crop` fills the square; add top/bottom/left/right to anchor.");
  }
  if (video.seconds > MAX_SOURCE_SECONDS) return reply(`❌ Video longer than ${MAX_SOURCE_SECONDS}s.`);

  const FOCAL = ["top", "bottom", "left", "right", "center"];
  const crop = FOCAL.find((f) => args.includes(f)) || (args.includes("crop") || args.includes("c") ? "center" : null);
  const requested = Math.min(MAX_SECONDS, +args.find((a) => /^\d{1,2}$/.test(a)) || MAX_SECONDS);
  const input = memoryManager.generateTempFileName(".mp4");
  const ogg = memoryManager.generateTempFileName(".ogg");
  let webp;

  try {
    const buffer = await downloadMediaMessage(target, "buffer", {}, { reuploadRequest: sock.updateMediaMessage });
    if (!buffer?.length) throw new Error("download failed");
    await writeFile(input, buffer);

    const { duration, hasAudio } = await probe(input);
    if (!hasAudio) return reply("❌ This video has no sound.");

    const seconds = Math.max(1, Math.min(requested, duration || requested));
    webp = await toWebp(input, seconds, crop);
    await toOpus(input, ogg, seconds);
    await sendAudioSticker(sock, from, {
      webp: await readFile(webp),
      ogg: await readFile(ogg),
      animated: true,
      quoted: msg,
    });
  } catch (err) {
    console.error("[AUDIO-STICKER ERR]", err);
    return reply(`❌ ${err.message}`);
  } finally {
    [input, ogg, webp].forEach((p) => p && memoryManager.safeUnlink(p));
  }
};

export default () => ({
  cmd: ["audiosticker", "as", "soundsticker"],
  desc: "Turn a video with sound into a WhatsApp sound sticker.",
  usage: "as [1-30] [crop|c] [top|bottom|left|right|center] (reply to a video with sound)",
  handler,
});
