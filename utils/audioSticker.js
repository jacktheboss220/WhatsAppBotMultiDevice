// WhatsApp "sound stickers": Message.audioStickerMessage(134) -> FutureProofMessage.message(1)
// -> StickerMessage.audioMessage(26). Baileys' WAProto (7.0.0-rc14) has neither field, so we
// patch encode() below. The patch skips itself once a Baileys upgrade defines the fields.
// Field numbers come from community reports (zapota, whatsapp-rust, flextofc), not WhatsApp docs.
import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { stat } from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import { generateMessageIDV2, prepareWAMessageMedia, proto } from "baileys";
import memoryManager from "./memory.js";

const { Message } = proto;

if (!("audioMessage" in Message.StickerMessage.prototype)) {
  const encodeSticker = Message.StickerMessage.encode;
  Message.StickerMessage.encode = (m, w) => {
    w = encodeSticker(m, w);
    if (m.audioMessage) Message.AudioMessage.encode(m.audioMessage, w.uint32(210).fork()).ldelim();
    return w;
  };
}
if (!("audioStickerMessage" in Message.prototype)) {
  const encodeMessage = Message.encode;
  /** @param {any} m */
  Message.encode = (m, w) => {
    w = encodeMessage(m, w);
    if (m.audioStickerMessage) {
      Message.FutureProofMessage.encode(m.audioStickerMessage, w.uint32(1074).fork()).ldelim();
    }
    return w;
  };
}

let ffmpegPath = process.env.FFMPEG_PATH;
if (!ffmpegPath) {
  try {
    const { default: ffmpegStatic } = await import("ffmpeg-static");
    ffmpegPath = ffmpegStatic && existsSync(ffmpegStatic) ? ffmpegStatic : "ffmpeg";
  } catch {
    ffmpegPath = "ffmpeg";
  }
}
ffmpeg.setFfmpegPath(ffmpegPath);

const run = (cmd, out) => new Promise((resolve, reject) => cmd.on("end", resolve).on("error", reject).save(out));

// No ffprobe ships with ffmpeg-static, so read `ffmpeg -i` stderr (exits 1 by design).
export async function probe(file) {
  const { stderr } = await promisify(execFile)(ffmpegPath, ["-hide_banner", "-i", file]).catch((e) => e);
  const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(stderr || "");
  return {
    duration: d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0,
    hasAudio: /Stream #.*Audio:/.test(stderr || ""),
  };
}

// Phones show the sticker but can't play the audio without these opus flags (zapota, phone-tested).
export const toOpus = (input, out, seconds) =>
  run(
    ffmpeg(input)
      .noVideo()
      .outputOptions([
        "-t", String(seconds),
        "-c:a", "libopus", "-b:a", "64k", "-ac", "1", "-ar", "48000",
        "-vbr", "on", "-compression_level", "10", "-frame_duration", "20",
        "-avoid_negative_ts", "make_zero",
      ])
      .toFormat("ogg"),
    out,
  );

// Upload fails with HTTP 413 above ~1 MB, so step quality/fps down until it fits.
const MAX_WEBP = 900 * 1024;
const STEPS = [
  { q: 60, fps: 15 },
  { q: 40, fps: 12 },
  { q: 25, fps: 10 },
  { q: 15, fps: 8 },
];
// Letterbox to 512x512 with transparent bars (no black border).
const FIT =
  "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=yuva420p";

// Square crop that fills the sticker, anchored like sticker.js (top/bottom/left/right/center).
const cropFilter = (pos) => {
  const side = "min(iw\\,ih)";
  const x = { left: "0", right: "iw-min(iw\\,ih)" }[pos] ?? "(iw-min(iw\\,ih))/2";
  const y = { top: "0", bottom: "ih-min(iw\\,ih)" }[pos] ?? "(ih-min(iw\\,ih))/2";
  return `crop=${side}:${side}:${x}:${y},scale=512:512,format=yuv420p`;
};

// `crop` is a focal position to fill the square; otherwise letterbox.
export async function toWebp(input, seconds, crop) {
  for (const { q, fps } of STEPS) {
    const out = memoryManager.generateTempFileName(".webp");
    await run(
      ffmpeg(input)
        .videoFilters(`fps=${fps},${crop ? cropFilter(crop) : FIT}`)
        .outputOptions(["-vcodec", "libwebp", "-lossless", "0", "-q:v", String(q), "-an", "-preset", "default", "-loop", "0", "-t", String(seconds)])
        .toFormat("webp"),
      out,
    );
    if ((await stat(out)).size <= MAX_WEBP) return out;
    memoryManager.safeUnlink(out);
  }
  throw new Error("Sticker too big even at lowest quality. Use a shorter length, e.g. `*as 10`.");
}

export async function sendAudioSticker(sock, jid, { webp, ogg, animated, quoted }) {
  const upload = { upload: sock.waUploadToServer };
  const [st, au] = await Promise.all([
    prepareWAMessageMedia({ sticker: webp }, upload),
    prepareWAMessageMedia({ audio: ogg, mimetype: "audio/ogg; codecs=opus" }, upload),
  ]);
  const sticker = st.stickerMessage;
  Object.assign(sticker, {
    mimetype: "image/webp",
    isAnimated: animated,
    width: 512,
    height: 512,
    audioMessage: au.audioMessage,
  });
  if (quoted?.key?.id) {
    sticker.contextInfo = {
      stanzaId: quoted.key.id,
      participant: quoted.key.participant || quoted.key.remoteJid,
      quotedMessage: quoted.message,
    };
  }
  const message = { audioStickerMessage: { message: { stickerMessage: sticker } } };
  const messageId = generateMessageIDV2(sock.user?.id);
  await sock.relayMessage(jid, message, { messageId });
  // relayMessage skips the sendMessage wrapper that fills the retry cache.
  sock.cacheSent?.({ remoteJid: jid, id: messageId }, message);
}
