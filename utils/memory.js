import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MemoryManager {
	constructor() {
		this.tempFiles = new Set();
		this.activeStreams = new Set();
		this.maxActiveStreams = 50;
	}

	// Files are only deleted once they are STALE. This used to call destroy() when 100 were tracked,
	// which unlinked every tracked file, including inputs of conversions still running.
	registerTempFile(filePath) {
		this.tempFiles.add(filePath);
		// Nothing legitimate takes 15 min, so this is a safety net for files a command failed to clean up
		// (before, the timer only forgot the path and left the file on disk).
		setTimeout(() => this.forgetAndUnlink(filePath), 900000).unref();
	}

	forgetAndUnlink(filePath) {
		this.safeUnlink(filePath);
		this.tempFiles.delete(filePath);
	}

	registerStream(stream) {
		if (this.activeStreams.size >= this.maxActiveStreams) {
			this.cleanupClosedStreams();
		}
		this.activeStreams.add(stream);
		stream.on("end", () => { this.activeStreams.delete(stream); });
		stream.on("error", () => { this.activeStreams.delete(stream); });
	}

	cleanupClosedStreams() {
		for (const stream of this.activeStreams) {
			if (stream.destroyed || stream.readableEnded || stream.writableEnded) {
				this.activeStreams.delete(stream);
			}
		}
	}

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

	createOptimizedReadStream(filePath, options = {}) {
		const stream = fs.createReadStream(filePath, {
			highWaterMark: 64 * 1024,
			autoClose: true,
			...options,
		});
		this.registerStream(stream);
		stream.on("end", () => {
			if (options.autoDelete) {
				setTimeout(() => this.safeUnlink(filePath), 1000);
			}
		});
		return stream;
	}

	createOptimizedWriteStream(filePath, options = {}) {
		const stream = fs.createWriteStream(filePath, {
			highWaterMark: 64 * 1024,
			autoClose: true,
			...options,
		});
		this.registerStream(stream);
		this.registerTempFile(filePath);
		return stream;
	}

	generateTempFileName(ext) {
		const filename = `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
		const tempDir = path.join(__dirname, "..", "temp");
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
		const filePath = path.join(tempDir, filename);
		this.registerTempFile(filePath);
		return filePath;
	}

	destroy() {
		for (const filePath of this.tempFiles) {
			this.safeUnlink(filePath);
		}
		for (const stream of this.activeStreams) {
			try {
				if (!stream.destroyed) stream.destroy();
			} catch {}
			this.activeStreams.delete(stream);
		}
	}
}

const memoryManager = new MemoryManager();

process.on("exit", () => {
	memoryManager.destroy();
});

export default memoryManager;
