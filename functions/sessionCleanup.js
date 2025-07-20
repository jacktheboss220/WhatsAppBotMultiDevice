const fs = require("fs");
const path = require("path");

/**
 * Clean up stale session files and data
 */
const cleanupStaleSessions = () => {
	try {
		const authDir = path.join(__dirname, "..", "baileys_auth_info");

		if (!fs.existsSync(authDir)) {
			console.log("Auth directory not found, skipping cleanup");
			return;
		}

		// Get all files in auth directory
		const files = fs.readdirSync(authDir);
		const preKeyFiles = files.filter((file) => file.startsWith("pre-key-"));
		const senderKeyFiles = files.filter((file) => file.startsWith("sender-key-"));

		console.log(`Found ${preKeyFiles.length} pre-key files and ${senderKeyFiles.length} sender-key files`);

		// Clean up old pre-key files (keep last 30 instead of 50)
		if (preKeyFiles.length > 50) {
			const sortedFiles = preKeyFiles.sort((a, b) => {
				const aNum = parseInt(a.match(/pre-key-(\d+)\.json/)?.[1] || "0");
				const bNum = parseInt(b.match(/pre-key-(\d+)\.json/)?.[1] || "0");
				return bNum - aNum; // Sort in descending order
			});

			// Delete older files (keep only 30 most recent)
			const filesToDelete = sortedFiles.slice(30);
			let deletedCount = 0;
			filesToDelete.forEach((file) => {
				try {
					fs.unlinkSync(path.join(authDir, file));
					deletedCount++;
				} catch (err) {
					console.error(`Failed to delete ${file}:`, err.message);
				}
			});
			console.log(`Deleted ${deletedCount} old pre-key files`);
		}

		// Clean up old sender-key files (these can accumulate and cause session issues)
		if (senderKeyFiles.length > 100) {
			const now = Date.now();
			let deletedSenderKeys = 0;

			senderKeyFiles.forEach((file) => {
				try {
					const filePath = path.join(authDir, file);
					const stats = fs.statSync(filePath);
					// Delete sender-key files older than 7 days
					if (now - stats.mtime.getTime() > 7 * 24 * 60 * 60 * 1000) {
						fs.unlinkSync(filePath);
						deletedSenderKeys++;
					}
				} catch (err) {
					console.error(`Failed to check/delete sender-key file ${file}:`, err.message);
				}
			});

			if (deletedSenderKeys > 0) {
				console.log(`Deleted ${deletedSenderKeys} old sender-key files`);
			}
		}
	} catch (error) {
		console.error("Error during session cleanup:", error);
	}
};

/**
 * Reset authentication completely (use with caution)
 */
const resetAuthentication = () => {
	try {
		const authDir = path.join(__dirname, "..", "baileys_auth_info");

		if (fs.existsSync(authDir)) {
			const files = fs.readdirSync(authDir);
			files.forEach((file) => {
				fs.unlinkSync(path.join(authDir, file));
			});
			console.log("All authentication files cleared");
		}

		// Also clear any cached auth data
		console.log("Authentication reset complete - QR scan will be required");
	} catch (error) {
		console.error("Error resetting authentication:", error);
	}
};

module.exports = {
	cleanupStaleSessions,
	resetAuthentication,
};
