const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");

/**
 * Comprehensive cleanup function for both message caches and session files
 */
const performFullCleanup = async () => {
	try {
		console.log("🧹 Starting comprehensive cleanup (messages + sessions)...");

		// Clear message caches
		await clearMessageCaches();

		// Clean up session files
		await cleanupStaleSessions();

		console.log("✅ Full cleanup completed successfully");
	} catch (error) {
		console.error("❌ Error during full cleanup:", error);
	}
};

/**
 * Cleanup function to prevent stale message references from causing empty messages
 */
const clearMessageCaches = async () => {
	try {
		console.log("🗂️ Cleaning up message caches...");

		// Clear any temp message files that might contain stale references
		const tempDir = path.join(__dirname, "..", "temp");

		try {
			const tempFiles = await fs.readdir(tempDir);
			const messageFiles = tempFiles.filter(
				(file) =>
					file.includes("message") ||
					file.includes("cache") ||
					file.includes("retry") ||
					file.includes("pending")
			);

			for (const file of messageFiles) {
				try {
					await fs.unlink(path.join(tempDir, file));
					console.log(`🗑️ Removed stale cache file: ${file}`);
				} catch (unlinkError) {
					// File might not exist or be in use, ignore
				}
			}
		} catch (dirError) {
			// Temp directory might not exist, ignore
		}

		console.log("✅ Message cache cleanup completed");
	} catch (error) {
		console.error("❌ Error during message cache cleanup:", error);
	}
};

/**
 * Clean up stale session files and authentication data
 */
const cleanupStaleSessions = async () => {
	try {
		console.log("🔐 Cleaning up session files...");
		const authDir = path.join(__dirname, "..", "baileys_auth_info");

		if (!fsSync.existsSync(authDir)) {
			console.log("Auth directory not found, skipping session cleanup");
			return;
		}

		// Get all files in auth directory
		const files = await fs.readdir(authDir);
		const preKeyFiles = files.filter((file) => file.startsWith("pre-key-"));
		const senderKeyFiles = files.filter((file) => file.startsWith("sender-key-"));
		const sessionFiles = files.filter((file) => file.startsWith("session-"));

		console.log(
			`Found ${preKeyFiles.length} pre-key files, ${senderKeyFiles.length} sender-key files, ${sessionFiles.length} session files`
		);

		// Clean up old pre-key files (keep last 30)
		if (preKeyFiles.length > 50) {
			const sortedFiles = preKeyFiles.sort((a, b) => {
				const aNum = parseInt(a.match(/pre-key-(\d+)\.json/)?.[1] || "0");
				const bNum = parseInt(b.match(/pre-key-(\d+)\.json/)?.[1] || "0");
				return bNum - aNum; // Sort in descending order
			});

			// Delete older files (keep only 30 most recent)
			const filesToDelete = sortedFiles.slice(30);
			let deletedCount = 0;
			for (const file of filesToDelete) {
				try {
					await fs.unlink(path.join(authDir, file));
					deletedCount++;
				} catch (err) {
					console.error(`Failed to delete ${file}:`, err.message);
				}
			}
			if (deletedCount > 0) {
				console.log(`🗑️ Deleted ${deletedCount} old pre-key files`);
			}
		}

		// Clean up old sender-key files
		if (senderKeyFiles.length > 100) {
			const now = Date.now();
			let deletedSenderKeys = 0;

			for (const file of senderKeyFiles) {
				try {
					const filePath = path.join(authDir, file);
					const stats = await fs.stat(filePath);
					// Delete sender-key files older than 7 days
					if (now - stats.mtime.getTime() > 7 * 24 * 60 * 60 * 1000) {
						await fs.unlink(filePath);
						deletedSenderKeys++;
					}
				} catch (err) {
					console.error(`Failed to check/delete sender-key file ${file}:`, err.message);
				}
			}

			if (deletedSenderKeys > 0) {
				console.log(`🗑️ Deleted ${deletedSenderKeys} old sender-key files`);
			}
		}

		// Clean up orphaned session files (older than 3 days)
		if (sessionFiles.length > 50) {
			const now = Date.now();
			let deletedSessions = 0;

			for (const file of sessionFiles) {
				try {
					const filePath = path.join(authDir, file);
					const stats = await fs.stat(filePath);
					// Delete session files older than 3 days
					if (now - stats.mtime.getTime() > 3 * 24 * 60 * 60 * 1000) {
						await fs.unlink(filePath);
						deletedSessions++;
					}
				} catch (err) {
					console.error(`Failed to check/delete session file ${file}:`, err.message);
				}
			}

			if (deletedSessions > 0) {
				console.log(`🗑️ Deleted ${deletedSessions} old session files`);
			}
		}

		console.log("✅ Session cleanup completed");
	} catch (error) {
		console.error("❌ Error during session cleanup:", error);
	}
};

/**
 * Reset authentication completely (use with caution)
 */
const resetAuthentication = async () => {
	try {
		console.log("🔄 Resetting authentication completely...");
		const authDir = path.join(__dirname, "..", "baileys_auth_info");

		if (fsSync.existsSync(authDir)) {
			const files = await fs.readdir(authDir);
			for (const file of files) {
				await fs.unlink(path.join(authDir, file));
			}
			console.log("🗑️ All authentication files cleared");
		}

		// Also clear message caches
		await clearMessageCaches();

		console.log("✅ Authentication reset complete - QR scan will be required");
	} catch (error) {
		console.error("❌ Error resetting authentication:", error);
	}
};

/**
 * Validate message object to ensure it won't cause empty message sends
 */
const validateMessageObject = (msg) => {
	if (!msg || typeof msg !== "object") {
		return false;
	}

	if (!msg.key || !msg.message) {
		return false;
	}

	// Check if message has actual content
	const messageKeys = Object.keys(msg.message);
	if (messageKeys.length === 0) {
		return false;
	}

	// Check for empty text messages
	if (
		msg.message.conversation === "" ||
		(msg.message.extendedTextMessage && msg.message.extendedTextMessage.text === "")
	) {
		return false;
	}

	return true;
};

/**
 * Sanitize message content to prevent empty sends
 */
const sanitizeMessageContent = (content) => {
	if (!content) return null;

	if (typeof content === "string") {
		const trimmed = content.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	if (typeof content === "object" && content.text) {
		const trimmed = content.text.trim();
		return trimmed.length > 0 ? { ...content, text: trimmed } : null;
	}

	return content;
};

/**
 * Emergency cleanup - use when bot is stuck or having major issues
 */
const emergencyCleanup = async () => {
	try {
		console.log("🚨 Performing emergency cleanup...");

		// Reset everything
		await resetAuthentication();

		// Clear temp directory completely
		const tempDir = path.join(__dirname, "..", "temp");
		try {
			const tempFiles = await fs.readdir(tempDir);
			for (const file of tempFiles) {
				try {
					await fs.unlink(path.join(tempDir, file));
				} catch (unlinkError) {
					// Ignore errors
				}
			}
			console.log("🗑️ Temp directory cleared");
		} catch (dirError) {
			// Directory might not exist
		}

		console.log("✅ Emergency cleanup completed");
	} catch (error) {
		console.error("❌ Error during emergency cleanup:", error);
	}
};

module.exports = {
	performFullCleanup,
	clearMessageCaches,
	cleanupStaleSessions,
	resetAuthentication,
	validateMessageObject,
	sanitizeMessageContent,
	emergencyCleanup,
};
