import dns from "dns/promises";
import net from "net";
import axios from "axios";

// Fetches images from URLs we do not control (Google image-search results). Guards against:
//  - SSRF: only public http(s) hosts, checked on the first request AND on every redirect
//  - disk/memory exhaustion: hard byte cap and overall time limit (a stream can trickle forever)
//  - non-images: content-type must be jpeg/png/webp/gif
// ponytail: the address is resolved once for the check and again by the HTTP client, so DNS rebinding in that
// gap is not covered. Pin the resolved IP into the request (custom agent `lookup`) if this ever fronts hostile input.

const IMAGE_TYPE = /^image\/(jpeg|png|webp|gif)$/;

// IPv4-mapped IPv6 ("::ffff:7f00:1" or "::ffff:127.0.0.1") -> "127.0.0.1", else null
const mappedV4 = (ip) => {
	const m = ip.toLowerCase().match(/^::ffff:(.+)$/);
	if (!m) return null;
	if (net.isIPv4(m[1])) return m[1];
	const h = m[1].split(":");
	if (h.length !== 2) return null;
	const n = (parseInt(h[0], 16) << 16) | parseInt(h[1], 16);
	return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
};

export const isPrivateIp = (ip) => {
	if (net.isIPv4(ip)) {
		const [a, b] = ip.split(".").map(Number);
		return (
			a === 0 || a === 10 || a === 127 ||
			(a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
			(a === 169 && b === 254) || // link-local + cloud metadata
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			a >= 224 // multicast / reserved
		);
	}
	if (net.isIPv6(ip)) {
		const l = ip.toLowerCase();
		const v4 = mappedV4(l);
		if (v4) return isPrivateIp(v4);
		return l === "::" || l === "::1" || /^f[cd]/.test(l) || /^fe[89ab]/.test(l) || l.startsWith("ff");
	}
	return true; // not an IP at all: refuse
};

export const assertPublicUrl = async (urlStr) => {
	let u;
	try {
		u = new URL(urlStr);
	} catch {
		throw new Error("invalid url");
	}
	if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("only http(s) urls are allowed");
	if (u.username || u.password) throw new Error("credentials in url are not allowed");
	if (u.port && u.port !== "80" && u.port !== "443") throw new Error("non-standard port");
	const host = u.hostname.replace(/^\[|\]$/g, "");
	let addrs;
	try {
		addrs = await dns.lookup(host, { all: true });
	} catch {
		throw new Error("host does not resolve");
	}
	if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("address is not public");
};

const readCapped = (stream, maxBytes, timeoutMs) =>
	new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		const done = (err, val) => {
			clearTimeout(timer);
			if (err) {
				stream.destroy();
				reject(err);
			} else resolve(val);
		};
		const timer = setTimeout(() => done(new Error("download timed out")), timeoutMs);
		stream.on("data", (c) => {
			size += c.length;
			if (size > maxBytes) return done(new Error("image too large"));
			chunks.push(c);
		});
		stream.on("end", () => done(null, Buffer.concat(chunks)));
		stream.on("error", (e) => done(e));
	});

// `assertUrl` is a seam for tests; production always uses assertPublicUrl.
export const fetchImageBuffer = async (url, { maxBytes = 10 * 1024 * 1024, timeoutMs = 15000, maxRedirects = 3, assertUrl = assertPublicUrl } = {}) => {
	let current = url;
	for (let hop = 0; hop <= maxRedirects; hop++) {
		await assertUrl(current);
		const res = await axios.get(current, {
			responseType: "stream",
			maxRedirects: 0, // follow redirects ourselves so every hop is checked
			validateStatus: () => true,
			timeout: timeoutMs,
			headers: { "User-Agent": "Mozilla/5.0" },
		});
		if ([301, 302, 303, 307, 308].includes(res.status)) {
			res.data.destroy();
			if (!res.headers.location) throw new Error("redirect without location");
			current = new URL(res.headers.location, current).href;
			continue;
		}
		if (res.status !== 200) {
			res.data.destroy();
			throw new Error(`http ${res.status}`);
		}
		const type = String(res.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
		if (!IMAGE_TYPE.test(type)) {
			res.data.destroy();
			throw new Error("not an image");
		}
		if (Number(res.headers["content-length"]) > maxBytes) {
			res.data.destroy();
			throw new Error("image too large");
		}
		return readCapped(res.data, maxBytes, timeoutMs);
	}
	throw new Error("too many redirects");
};
