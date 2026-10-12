import fs from "fs";
import os from "os";
import path from "path";
import mdClient from "../db/client.js";

const TEMP_PATH = path.join(os.tmpdir(), "ytdlp-cookies.txt");
const col = () => mdClient.db("MyBotDataDB").collection("AuthTable");

// Three states: null = not loaded yet, false = no cookies, string = file path
let _cachedPath = null;

async function _writeTemp(content) {
  fs.writeFileSync(TEMP_PATH, content, "utf8");
  return TEMP_PATH;
}

/** Returns file path for yt-dlp --cookies, or null if none configured. */
export async function getCookiePath() {
  if (process.env.YTDLP_COOKIES) return process.env.YTDLP_COOKIES;
  if (_cachedPath !== null) return _cachedPath || null;

  try {
    const doc = await col().findOne({ _id: "bot" }, { projection: { ytdlp_cookies: 1 } });
    const content = doc?.ytdlp_cookies?.trim();
    if (content) {
      _cachedPath = await _writeTemp(content);
    } else {
      _cachedPath = false;
    }
  } catch {
    _cachedPath = false;
  }
  return _cachedPath || null;
}

/** Save new cookies content to DB + temp file. Pass empty string to clear. */
export async function saveCookies(content) {
  const trimmed = (content || "").trim();
  await col().updateOne({ _id: "bot" }, { $set: { ytdlp_cookies: trimmed } }, { upsert: true });
  if (trimmed) {
    _cachedPath = await _writeTemp(trimmed);
  } else {
    try {
      fs.unlinkSync(TEMP_PATH);
    } catch {
      /* already gone */
    }
    _cachedPath = false;
  }
}

/** Read stored cookies content from DB. */
export async function getCookiesContent() {
  try {
    const doc = await col().findOne({ _id: "bot" }, { projection: { ytdlp_cookies: 1 } });
    return doc?.ytdlp_cookies || "";
  } catch {
    return "";
  }
}
