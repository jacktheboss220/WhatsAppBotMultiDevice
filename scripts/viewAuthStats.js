/**
 * View MongoDB Auth State Statistics Script
 *
 * This script shows statistics about the authentication data stored in MongoDB.
 *
 * Usage: node scripts/viewAuthStats.js
 */

import { getAuthStateStats } from "../functions/useMongoDBAuthState.js";
import mdClient from "../mongodb.js";

const viewStats = async () => {
	try {
		console.log("🔄 Connecting to MongoDB...");
		await mdClient.connect();
		console.log("✅ Connected to database\n");

		const stats = await getAuthStateStats();

		console.log("📊 MongoDB Auth State Statistics");
		console.log("═══════════════════════════════════");
		console.log(`Total Documents: ${stats.total}`);
		console.log("");

		if (stats.total === 0) {
			console.log("ℹ️  No auth state found in database");
			console.log("   Bot will require QR scan on next startup");
		} else {
			console.log("Documents by Type:");
			console.log("─────────────────────────────────");

			const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
			for (const [type, count] of sortedTypes) {
				const percentage = ((count / stats.total) * 100).toFixed(1);
				console.log(`  ${type.padEnd(25)} ${count.toString().padStart(6)} (${percentage}%)`);
			}

			console.log("═══════════════════════════════════");

			// Show what each type means
			console.log("\nType Descriptions:");
			console.log("  creds           - Main credentials");
			console.log("  pre-key         - Pre-keys for encryption");
			console.log("  session         - Active session keys");
			console.log("  sender-key      - Group sender keys");
			console.log("  app-state       - WhatsApp app state sync");
		}

		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
};

viewStats();
