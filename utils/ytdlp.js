import ffmpeg from "ffmpeg-static";
import defaultYoutubedl, { create } from "youtube-dl-exec";
import { getCookiePath } from "../functions/cookieManager.js";

// Use the system yt-dlp binary when YTDLP_PATH is set (e.g. /usr/local/bin/yt-dlp on
// the server). Otherwise fall back to the binary bundled with youtube-dl-exec.
export const youtubedl = process.env.YTDLP_PATH ? create(process.env.YTDLP_PATH) : defaultYoutubedl;

export const ytdlpOpts = async (extra = {}) => {
	const opts = {
		noCheckCertificates: true,
		noWarnings: true,
		noPlaylist: true,
		forceIpv4: true,
		ffmpegLocation: ffmpeg,
		// tv + android_vr work without a PO token (server-side, no browser). web is
		// kept last as a cookie-backed extra. android/ios are dead on modern YouTube.
		extractorArgs: "youtube:player_client=tv,android_vr,web",
		// yt-dlp now requires an EJS runtime to solve YouTube JS challenges (2026+).
		// Node.js is available in the container, so use it.
		jsRuntimes: "node",
		...extra,
	};
	const cookiePath = await getCookiePath();
	if (cookiePath) opts.cookies = cookiePath;
	return opts;
};

// Only real YouTube links reach yt-dlp. Its generic extractor will fetch ANY url, which would let a
// group member point the server at internal addresses (SSRF). Returns the normalised url or null.
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);
export const parseYouTubeUrl = (input) => {
	try {
		const u = new URL(input);
		return (u.protocol === "https:" || u.protocol === "http:") && YT_HOSTS.has(u.hostname.toLowerCase())
			? u.href
			: null;
	} catch {
		return null;
	}
};

// Applied to DOWNLOAD calls (not the info lookup): yt-dlp skips anything longer than 30 min / live,
// and aborts files over 60 MB, before/while downloading instead of after.
export const downloadLimits = { maxFilesize: "60M", matchFilter: "duration<=1800 & !is_live" };

// Self-check: `bun utils/ytdlp.js`
if (import.meta.main) {
	const assert = (await import("assert")).strict;
	for (const ok of ["https://www.youtube.com/watch?v=abc", "https://youtu.be/abc", "http://m.youtube.com/watch?v=1", "https://music.youtube.com/watch?v=1"])
		assert.ok(parseYouTubeUrl(ok), ok);
	for (const bad of ["http://169.254.169.254/latest/meta-data", "http://localhost:6379", "https://youtube.com.evil.com/x", "https://youtube.com@evil.com/x", "file:///etc/passwd", "--exec id", "javascript:alert(1)", "", "youtube.com/watch?v=1"])
		assert.equal(parseYouTubeUrl(bad), null, bad);
	console.log("ytdlp url check ok");
	process.exit(0); // importing this file opens the Mongo client (cookie lookup), which would keep the process alive
}
