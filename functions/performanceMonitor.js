/**
 * Performance monitoring and memory optimization utilities
 */

const fs = require("fs");
const path = require("path");
const memoryManager = require("./memoryUtils");

class PerformanceMonitor {
	constructor() {
		this.startTime = Date.now();
		this.metrics = {
			memoryUsage: [],
			commandCount: 0,
			errorCount: 0,
			fileOperations: 0,
		};

		this.startMonitoring();
	}

	startMonitoring() {
		// Log memory usage every minute
		setInterval(() => {
			this.logMemoryUsage();
		}, 60000);

		// Detailed analysis every 10 minutes
		setInterval(() => {
			this.performDetailedAnalysis();
		}, 600000);
	}

	logMemoryUsage() {
		const memUsage = process.memoryUsage();
		const timestamp = new Date().toISOString();

		const memoryData = {
			timestamp,
			heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
			heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
			external: Math.round(memUsage.external / 1024 / 1024), // MB
			rss: Math.round(memUsage.rss / 1024 / 1024), // MB
		};

		this.metrics.memoryUsage.push(memoryData);

		// Keep only last 100 entries
		if (this.metrics.memoryUsage.length > 100) {
			this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
		}

		// Warning for high memory usage
		if (memoryData.heapUsed > 400) {
			// Above 400MB
			console.warn(`⚠️  High memory usage detected: ${memoryData.heapUsed}MB`);
			this.triggerMemoryCleanup();
		}

		console.log(`📊 Memory: ${memoryData.heapUsed}MB heap, ${memoryData.rss}MB total`);
	}

	performDetailedAnalysis() {
		const uptime = Math.round((Date.now() - this.startTime) / 1000 / 60); // minutes
		const recent = this.metrics.memoryUsage.slice(-10);

		if (recent.length > 0) {
			const avgMemory = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
			const maxMemory = Math.max(...recent.map((m) => m.heapUsed));

			console.log(`\n📈 Performance Report (${uptime}min uptime):`);
			console.log(`   Average Memory: ${Math.round(avgMemory)}MB`);
			console.log(`   Peak Memory: ${maxMemory}MB`);
			console.log(`   Commands Processed: ${this.metrics.commandCount}`);
			console.log(`   Errors: ${this.metrics.errorCount}`);
			console.log(`   File Operations: ${this.metrics.fileOperations}\n`);

			// Save to file for analysis
			this.saveMetrics();
		}
	}

	triggerMemoryCleanup() {
		console.log("🧹 Triggering memory cleanup...");

		// Trigger garbage collection if available
		if (global.gc) {
			global.gc();
			console.log("✅ Garbage collection completed");
		}

		// Clear old temp files
		this.cleanupTempFiles();

		// Force memory manager cleanup
		memoryManager.performGarbageCollection();
	}

	cleanupTempFiles() {
		const tempDir = path.join(__dirname, "..", "temp");
		const maxAge = 10 * 60 * 1000; // 10 minutes

		try {
			const files = fs.readdirSync(tempDir);
			let cleanedCount = 0;

			files.forEach((file) => {
				if (file === ".gitkeep" || file === ".gitignore") return;

				const filePath = path.join(tempDir, file);
				const stats = fs.statSync(filePath);

				if (Date.now() - stats.mtime.getTime() > maxAge) {
					try {
						fs.unlinkSync(filePath);
						cleanedCount++;
					} catch (err) {
						console.warn(`Failed to cleanup ${file}:`, err.message);
					}
				}
			});

			if (cleanedCount > 0) {
				console.log(`🗑️  Cleaned up ${cleanedCount} old temp files`);
			}
		} catch (err) {
			console.warn("Temp cleanup error:", err.message);
		}
	}

	saveMetrics() {
		const metricsPath = path.join(__dirname, "..", "performance-metrics.json");
		const data = {
			timestamp: new Date().toISOString(),
			uptime: Math.round((Date.now() - this.startTime) / 1000 / 60),
			...this.metrics,
		};

		try {
			fs.writeFileSync(metricsPath, JSON.stringify(data, null, 2));
		} catch (err) {
			console.warn("Failed to save metrics:", err.message);
		}
	}

	incrementCommandCount() {
		this.metrics.commandCount++;
	}

	incrementErrorCount() {
		this.metrics.errorCount++;
	}

	incrementFileOperations() {
		this.metrics.fileOperations++;
	}

	getMetrics() {
		return {
			...this.metrics,
			uptime: Math.round((Date.now() - this.startTime) / 1000 / 60),
		};
	}
}

// Create global performance monitor
const performanceMonitor = new PerformanceMonitor();

// Export for use in other modules
module.exports = performanceMonitor;
