import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

/**
 * YouTube anti-bot utilities
 * Provides rotating user agents, cookie management, and proxy support
 */

// Configuration from environment variables
const CONFIG = {
	DELAY_BETWEEN_REQUESTS: parseInt(process.env.YOUTUBE_DELAY_BETWEEN_REQUESTS) || 1000,
	MAX_RETRIES: parseInt(process.env.YOUTUBE_MAX_RETRIES) || 3,
	RETRY_DELAY: parseInt(process.env.YOUTUBE_RETRY_DELAY) || 2000,
	MAX_AUDIO_SIZE: parseInt(process.env.MAX_AUDIO_SIZE_MB) || 50,
	MAX_VIDEO_SIZE: parseInt(process.env.MAX_VIDEO_SIZE_MB) || 50,
	DOWNLOAD_TIMEOUT: parseInt(process.env.DOWNLOAD_TIMEOUT_SECONDS) || 600,
	DEBUG: process.env.YOUTUBE_DEBUG === "true",
	ENABLE_USER_AGENT_ROTATION: process.env.ENABLE_USER_AGENT_ROTATION !== "false",
	FORCE_DISABLE_YTDLP: process.env.FORCE_DISABLE_YTDLP === "true",
};

// Rotating User Agents to avoid detection
const USER_AGENTS = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0",
];

let currentUserAgentIndex = 0;

/**
 * Get the next user agent in rotation
 */
function getRotatingUserAgent() {
	if (!CONFIG.ENABLE_USER_AGENT_ROTATION) {
		return USER_AGENTS[0]; // Use first user agent if rotation is disabled
	}

	const userAgent = USER_AGENTS[currentUserAgentIndex];
	currentUserAgentIndex = (currentUserAgentIndex + 1) % USER_AGENTS.length;

	if (CONFIG.DEBUG) {
		console.log(`Using User Agent ${currentUserAgentIndex}: ${userAgent.substring(0, 50)}...`);
	}

	return userAgent;
}

/**
 * Get common headers to mimic real browser requests
 */
function getBrowserHeaders(userAgent = null) {
	if (!userAgent) {
		userAgent = getRotatingUserAgent();
	}

	return {
		"User-Agent": userAgent,
		Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
		"Accept-Language": "en-US,en;q=0.9",
		"Accept-Encoding": "gzip, deflate, br",
		Connection: "keep-alive",
		"Upgrade-Insecure-Requests": "1",
		"Sec-Fetch-Dest": "document",
		"Sec-Fetch-Mode": "navigate",
		"Sec-Fetch-Site": "none",
		"Sec-Fetch-User": "?1",
		DNT: "1",
	};
}

/**
 * Get youtube-dl-exec options with anti-bot measures
 */
function getYtDlpOptions(additionalOptions = {}) {
	const userAgent = getRotatingUserAgent();

	const baseOptions = {
		userAgent: userAgent,
		addHeader: [
			`User-Agent:${userAgent}`,
			"Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Accept-Language:en-US,en;q=0.9",
			"Accept-Encoding:gzip, deflate, br",
			"Connection:keep-alive",
			"Upgrade-Insecure-Requests:1",
			"Sec-Fetch-Dest:document",
			"Sec-Fetch-Mode:navigate",
			"Sec-Fetch-Site:none",
		],
		noPlaylist: true,
		// Use IPv4 to avoid potential IPv6 issues
		forceIpv4: true,
		// Retry on failures
		retries: 3,
		// Fragment retries
		fragmentRetries: 5,
		// Skip download of unavailable fragments
		skipUnavailableFragments: true,
		// Prefer free formats
		preferFreeFormats: true,
	};

	return { ...baseOptions, ...additionalOptions };
}

/**
 * Get ytdl-core options with anti-bot measures
 */
function getYtdlCoreOptions(agent, additionalOptions = {}) {
	const userAgent = getRotatingUserAgent();

	const baseOptions = {
		agent: agent,
		requestOptions: {
			headers: getBrowserHeaders(userAgent),
			// Add timeout to prevent hanging
			timeout: 30000,
		},
		// Add lang preference
		lang: "en",
		// More conservative quality settings
		quality: "highest",
		// Use more basic filter to avoid complex parsing
		filter: "audio",
	};

	return { ...baseOptions, ...additionalOptions };
}

/**
 * Delay function for rate limiting
 */
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = CONFIG.MAX_RETRIES, baseDelay = CONFIG.RETRY_DELAY) {
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			if (i === maxRetries - 1) {
				throw error;
			}

			const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 1000;

			if (CONFIG.DEBUG) {
				console.log(`Attempt ${i + 1} failed: ${error.message}`);
				console.log(`Retrying in ${delayTime}ms...`);
			}

			await delay(delayTime);
		}
	}
}

/**
 * Check if error is related to bot detection
 */
function isBotDetectionError(error) {
	const errorMessage = error.message.toLowerCase();
	return (
		errorMessage.includes("sign in to confirm") ||
		errorMessage.includes("bot") ||
		errorMessage.includes("automated") ||
		errorMessage.includes("verification") ||
		errorMessage.includes("captcha") ||
		errorMessage.includes("403") ||
		errorMessage.includes("429")
	);
}

/**
 * Check if yt-dlp binary is working properly
 */
async function checkYtDlpBinary() {
	// Check if force disabled first
	if (CONFIG.FORCE_DISABLE_YTDLP) {
		if (CONFIG.DEBUG) {
			console.log("yt-dlp force disabled via environment variable");
		}
		return false;
	}

	try {
		// Use dynamic import for ES modules
		const { default: youtubedl } = await import("youtube-dl-exec");
		// Try to get version to test if binary works
		const result = await youtubedl("--version");
		if (CONFIG.DEBUG) {
			console.log("yt-dlp version:", result);
		}
		return true;
	} catch (error) {
		if (CONFIG.DEBUG) {
			console.log("yt-dlp binary check failed:", error.message);
		}
		return false;
	}
}

/**
 * Check if error is related to ytdl-core parsing issues
 */
function isYtdlCoreParsingError(error) {
	const errorMessage = error.message.toLowerCase();
	return (
		errorMessage.includes("error when parsing") ||
		errorMessage.includes("watch.html") ||
		errorMessage.includes("youtube made a change") ||
		errorMessage.includes("invalid ipv6 format") ||
		errorMessage.includes("unable to extract") ||
		errorMessage.includes("no video formats found")
	);
}

/**
 * Check if error is related to PyInstaller/binary corruption
 */
function isPyInstallerError(error) {
	const errorMessage = error.message.toLowerCase();
	return (
		errorMessage.includes("pyinstaller") ||
		errorMessage.includes("pkg archive") ||
		errorMessage.includes("embedded") ||
		errorMessage.includes("executable") ||
		(errorMessage.includes("yt-dlp.exe") && errorMessage.includes("could not load"))
	);
}

export {
	CONFIG,
	getRotatingUserAgent,
	getBrowserHeaders,
	getYtDlpOptions,
	getYtdlCoreOptions,
	delay,
	retryWithBackoff,
	isBotDetectionError,
	isYtdlCoreParsingError,
	checkYtDlpBinary,
	isPyInstallerError,
};
