/**
 * File caching system to reduce disk I/O for frequently accessed files
 * Useful for stickers, images that are sent multiple times
 */

class FileCache {
	constructor(maxSize = 50 * 1024 * 1024) {
		// 50MB max cache size
		this.cache = new Map();
		this.maxSize = maxSize;
		this.currentSize = 0;
		this.stats = {
			hits: 0,
			misses: 0,
			evictions: 0,
		};
	}

	/**
	 * Get file from cache or return null
	 */
	get(filePath) {
		if (this.cache.has(filePath)) {
			const entry = this.cache.get(filePath);
			// Update access time
			entry.lastAccess = Date.now();
			entry.accessCount++;
			this.stats.hits++;
			return entry.buffer;
		}
		this.stats.misses++;
		return null;
	}

	/**
	 * Add file to cache
	 */
	set(filePath, buffer) {
		const size = buffer.length;

		// Don't cache files larger than 10MB
		if (size > 10 * 1024 * 1024) {
			return false;
		}

		// Evict old entries if needed
		while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
			this.evictOldest();
		}

		this.cache.set(filePath, {
			buffer,
			size,
			lastAccess: Date.now(),
			accessCount: 0,
		});

		this.currentSize += size;
		return true;
	}

	/**
	 * Evict least recently used entry
	 */
	evictOldest() {
		let oldestKey = null;
		let oldestTime = Infinity;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.lastAccess < oldestTime) {
				oldestTime = entry.lastAccess;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			const entry = this.cache.get(oldestKey);
			this.currentSize -= entry.size;
			this.cache.delete(oldestKey);
			this.stats.evictions++;
		}
	}

	/**
	 * Clear entire cache
	 */
	clear() {
		this.cache.clear();
		this.currentSize = 0;
	}

	/**
	 * Get cache statistics
	 */
	getStats() {
		const hitRate =
			this.stats.hits + this.stats.misses > 0
				? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
				: 0;

		return {
			...this.stats,
			hitRate: `${hitRate}%`,
			entries: this.cache.size,
			sizeMB: (this.currentSize / 1024 / 1024).toFixed(2),
			maxSizeMB: (this.maxSize / 1024 / 1024).toFixed(2),
		};
	}

	/**
	 * Remove specific file from cache
	 */
	delete(filePath) {
		if (this.cache.has(filePath)) {
			const entry = this.cache.get(filePath);
			this.currentSize -= entry.size;
			this.cache.delete(filePath);
			return true;
		}
		return false;
	}
}

// Singleton instance
const fileCache = new FileCache();

export default fileCache;
