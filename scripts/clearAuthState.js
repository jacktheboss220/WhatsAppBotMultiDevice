/**
 * Clear MongoDB Auth State Script
 *
 * This script clears all authentication data from MongoDB.
 * Use this to force a fresh QR scan or reset the bot completely.
 *
 * Usage: node scripts/clearAuthState.js
 */

import { clearMongoDBAuthState, getAuthStateStats } from "../functions/useMongoDBAuthState.js";
import mdClient from "../mongodb.js";
import readline from "readline";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const performClear = async () => {
	try {
		console.log("🔄 Connecting to MongoDB...");
		await mdClient.connect();
		console.log("✅ Connected to database\n");

		// Show current stats
		const stats = await getAuthStateStats();
		console.log("📊 Current Auth State:");
		console.log(`   Total documents: ${stats.total}`);
		console.log(`   By type:`, stats.byType);
		console.log("");

		if (stats.total === 0) {
			console.log("ℹ️  No auth state found in database");
			process.exit(0);
		}

		// Ask for confirmation
		const answer = await ask(`⚠️  Are you sure you want to delete ${stats.total} auth documents? (yes/no): `);

		if (answer.toLowerCase() !== "yes") {
			console.log("❌ Operation cancelled");
			process.exit(0);
		}

		// Clear auth state
		console.log("\n🗑️  Clearing auth state...");
		const deletedCount = await clearMongoDBAuthState();

		console.log(`✅ Successfully deleted ${deletedCount} documents`);
		console.log("   Bot will require QR scan on next startup");

		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	} finally {
		rl.close();
	}
};

performClear();
