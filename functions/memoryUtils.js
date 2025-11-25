import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Memory optimization utilities for WhatsApp Bot
 */

class MemoryManager {
	constructor() {
		this.tempFiles = new Set();
		this.activeStreams = new Set();
		this.memoryThreshold = 512 * 1024 * 1024; // 512MB threshold

		// Auto cleanup every 5 minutes
		this.cleanupInterval = setInterval(() => {
			this.performGarbageCollection();
		}, 300000);

		// Monitor memory usage
		this.memoryCheckInterval = setInterval(() => {
			this.checkMemoryUsage();
		}, 60000);
	}

	/**
	 * Register a temporary file for automatic cleanup
	 * @param {string} filePath
	 */
	registerTempFile(filePath) {
		this.tempFiles.add(filePath);

		// Auto-remove from set after 30 minutes
		setTimeout(() => {
			this.tempFiles.delete(filePath);
		}, 1800000);
	}

	/**
	 * Register an active stream for monitoring
	 * @param {Stream} stream
	 */
	registerStream(stream) {
		this.activeStreams.add(stream);

		// Auto cleanup when stream ends
		stream.on("end", () => {
			this.activeStreams.delete(stream);
		});

		stream.on("error", () => {
			this.activeStreams.delete(stream);
		});
	}

	/**
	 * Safe file deletion with error handling
	 * @param {string} filePath
	 */
	safeUnlink(filePath) {
		try {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
				this.tempFiles.delete(filePath);
				return true;
			}
		} catch (error) {
			console.warn(`Failed to delete file ${filePath}:`, error.message);
		}
		return false;
	}

	/**
	 * Create optimized read stream with automatic cleanup
	 * @param {string} filePath
	 * @param {object} options
	 */
	createOptimizedReadStream(filePath, options = {}) {
		const defaultOptions = {
			highWaterMark: 64 * 1024, // 64KB chunks for better memory usage
			autoClose: true,
			...options,
		};

		const stream = fs.createReadStream(filePath, defaultOptions);
		this.registerStream(stream);

		// Auto cleanup file after stream ends
		stream.on("end", () => {
			if (options.autoDelete) {
				setTimeout(() => this.safeUnlink(filePath), 1000);
			}
		});

		return stream;
	}

	/**
	 * Create optimized write stream with automatic cleanup
	 * @param {string} filePath
	 * @param {object} options
	 */
	createOptimizedWriteStream(filePath, options = {}) {
		const defaultOptions = {
			highWaterMark: 64 * 1024, // 64KB chunks
			autoClose: true,
			...options,
		};

		const stream = fs.createWriteStream(filePath, defaultOptions);
		this.registerStream(stream);
		this.registerTempFile(filePath);

		return stream;
	}

	/**
	 * Stream-based file copy for large files
	 * @param {string} source
	 * @param {string} destination
	 */
	async streamCopy(source, destination) {
		return new Promise((resolve, reject) => {
			const readStream = this.createOptimizedReadStream(source);
			const writeStream = this.createOptimizedWriteStream(destination);

			readStream.pipe(writeStream);

			writeStream.on("finish", resolve);
			writeStream.on("error", reject);
			readStream.on("error", reject);
		});
	}

	/**
	 * Optimized buffer processing for media files
	 * @param {Buffer} buffer
	 * @param {number} chunkSize
	 */
	processBufferInChunks(buffer, chunkSize = 64 * 1024) {
		const chunks = [];
		for (let i = 0; i < buffer.length; i += chunkSize) {
			chunks.push(buffer.slice(i, i + chunkSize));
		}
		return chunks;
	}

	/**
	 * Check current memory usage and trigger cleanup if needed
	 */
	checkMemoryUsage() {
		const memUsage = process.memoryUsage();
		const totalMemory = memUsage.heapUsed + memUsage.external;

		console.log(`Memory Usage: ${Math.round(totalMemory / 1024 / 1024)}MB`);

		if (totalMemory > this.memoryThreshold) {
			console.warn("High memory usage detected, performing cleanup...");
			this.performGarbageCollection();
		}
	}

	/**
	 * Perform garbage collection and cleanup
	 */
	performGarbageCollection() {
		// Clean up temp files
		let cleanedFiles = 0;
		for (const filePath of this.tempFiles) {
			if (this.safeUnlink(filePath)) {
				cleanedFiles++;
			}
		}

		// Close inactive streams
		let closedStreams = 0;
		for (const stream of this.activeStreams) {
			if (stream.destroyed || stream.readableEnded || stream.writableEnded) {
				try {
					if (stream.destroy) stream.destroy();
					this.activeStreams.delete(stream);
					closedStreams++;
				} catch (error) {
					console.warn("Error closing stream:", error.message);
				}
			}
		}

		// Force garbage collection if available
		if (global.gc) {
			global.gc();
		}

		console.log(`Cleanup completed: ${cleanedFiles} files, ${closedStreams} streams`);
	}

	/**
	 * Generate random filename with proper extension
	 * @param {string} ext
	 */
	generateTempFileName(ext) {
		const filename = `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
		const tempDir = path.join(__dirname, "..", "temp");

		// Ensure temp directory exists
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		const filePath = path.join(tempDir, filename);
		this.registerTempFile(filePath);
		return filePath;
	}

	/**
	 * Cleanup and destroy the memory manager
	 */
	destroy() {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
		if (this.memoryCheckInterval) {
			clearInterval(this.memoryCheckInterval);
		}

		this.performGarbageCollection();
	}
}

// Create global instance
const memoryManager = new MemoryManager();

// Cleanup on process exit
process.on("exit", () => {
	memoryManager.destroy();
});

process.on("SIGINT", () => {
	memoryManager.destroy();
	process.exit(0);
});

export default memoryManager;
