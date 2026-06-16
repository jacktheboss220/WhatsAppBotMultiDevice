import fs from "fs";
import fileCache from "./fileCache.js";

/**
 * Utility functions for handling large files efficiently
 */

/**
 * Read file efficiently with memory management and caching
 * @param {string} filePath - Path to the file
 * @param {number} maxSize - Maximum file size in bytes (default 50MB)
 * @param {boolean} useCache - Whether to use cache (default true for media files)
 * @returns {Promise<Buffer>} File buffer
 */
async function readFileEfficiently(filePath, maxSize = 50 * 1024 * 1024, useCache = true) {
	// Check cache first
	if (useCache) {
		const cached = fileCache.get(filePath);
		if (cached) {
			return cached;
		}
	}

	return new Promise((resolve, reject) => {
		// Check if file exists first
		if (!fs.existsSync(filePath)) {
			reject(new Error(`File not found: ${filePath}`));
			return;
		}

		let stats;
		try {
			stats = fs.statSync(filePath);
		} catch (err) {
			reject(err);
			return;
		}

		if (stats.size > maxSize) {
			reject(
				new Error(
					`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max ${(maxSize / 1024 / 1024).toFixed(
						0
					)}MB)`
				)
			);
			return;
		}

		// For small files (< 5MB), use async readFile
		if (stats.size < 5 * 1024 * 1024) {
			fs.readFile(filePath, (err, buffer) => {
				if (err) {
					reject(err);
				} else {
					// Cache small files if enabled
					if (useCache && stats.size < 2 * 1024 * 1024) {
						fileCache.set(filePath, buffer);
					}
					resolve(buffer);
				}
			});
			return;
		}

		// For larger files, read in chunks to be more memory efficient
		const chunks = [];
		const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

		stream.on("data", (chunk) => {
			chunks.push(chunk);
		});

		stream.on("end", () => {
			try {
				const buffer = Buffer.concat(chunks);
				// Cache if enabled and not too large
				if (useCache && stats.size < 5 * 1024 * 1024) {
					fileCache.set(filePath, buffer);
				}
				resolve(buffer);
			} catch (error) {
				reject(error);
			}
		});

		stream.on("error", reject);
	});
}

/**
 * Check if file is valid audio format
 * @param {string} filePath
 * @returns {boolean}
 */
function isValidAudioFile(filePath) {
	try {
		const stats = fs.statSync(filePath);

		// Check if file exists and has content
		if (!stats.isFile() || stats.size === 0) {
			console.warn(`Audio validation failed: File doesn't exist or is empty - ${filePath}`);
			return false;
		}

		// For audio files, we'll be more lenient
		// Just check basic file properties rather than strict signatures
		const fileSizeMB = stats.size / 1024 / 1024;

		// Audio files should be at least 10KB and less than 100MB
		if (stats.size < 10 * 1024) {
			console.warn(`Audio validation failed: File too small (${stats.size} bytes) - ${filePath}`);
			return false;
		}

		if (fileSizeMB > 100) {
			console.warn(`Audio validation failed: File too large (${fileSizeMB.toFixed(2)}MB) - ${filePath}`);
			return false;
		}

		// Try to read file header - if we can read it, it's probably valid
		try {
			const buffer = fs.readFileSync(filePath, { start: 0, end: Math.min(1024, stats.size) });

			// Check for some common audio signatures, but be more flexible
			const signature = buffer.toString("hex").toLowerCase();

			// Look for common audio file patterns
			const audioPatterns = [
				"fffb",
				"fff3",
				"fff2", // MP3 frames
				"4944", // ID3 tag
				"474554",
				"4f676753", // OGG
				"664c6143", // FLAC
				"52494646", // WAV/RIFF
				"000000",
				"667479", // MP4/M4A container formats
				"6d6f6f",
				"6674797", // MOV/MP4 variants
				"4d344120", // M4A
			];

			const hasAudioSignature = audioPatterns.some((pattern) => signature.includes(pattern));

			if (!hasAudioSignature) {
				console.warn(
					`Audio validation warning: No recognized audio signature found, but proceeding - ${filePath}`
				);
				// Don't fail validation, just warn
			}

			console.log(`Audio file validated successfully: ${fileSizeMB.toFixed(2)}MB - ${filePath}`);
			return true;
		} catch (readError) {
			console.warn(`Audio validation failed: Cannot read file header - ${filePath}:`, readError.message);
			return false;
		}
	} catch (error) {
		console.warn("Error validating audio file:", error.message);
		return false;
	}
}

/**
 * Check if file is valid video format
 * @param {string} filePath
 * @returns {boolean}
 */
function isValidVideoFile(filePath) {
	try {
		const stats = fs.statSync(filePath);

		// Check if file exists and has content
		if (!stats.isFile() || stats.size === 0) {
			return false;
		}

		// Read first few bytes to check video signature
		const buffer = fs.readFileSync(filePath, { start: 0, end: 11 });
		const signature = buffer.toString("hex");

		// Check for common video file signatures
		const videoSignatures = [
			"000000", // MP4/MOV
			"667479", // MP4
			"6d6f6f", // MP4/MOV
			"000001", // MPEG
			"464c56", // FLV
			"41564931", // AVI
		];

		return videoSignatures.some((sig) => signature.startsWith(sig));
	} catch (error) {
		console.warn("Error validating video file:", error.message);
		return false;
	}
}

export { readFileEfficiently, isValidVideoFile, isValidAudioFile };
