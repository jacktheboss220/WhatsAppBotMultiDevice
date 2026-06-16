import mdClient from "../db/client.js";
import socket from "../core/socket.js";
import { extractPhoneNumber } from "../utils/lid.js";

const migrate = async () => {
	try {
		// 1. Connect to MongoDB
		await mdClient.connect();
		console.log("✅ Connected to MongoDB");
		const memberCollection = mdClient.db("MyBotDataDB").collection("Members");

		// 2. Connect to WhatsApp
		console.log("🔄 Connecting to WhatsApp...");
		const sock = await socket();

		// Wait for connection to be open
		await new Promise((resolve, reject) => {
			sock.ev.on("connection.update", (update) => {
				const { connection, lastDisconnect } = update;
				if (connection === "open") {
					console.log("✅ WhatsApp Connection Open");
					resolve();
				} else if (connection === "close") {
					if (lastDisconnect?.error?.output?.statusCode !== 401) {
						// Wait for reconnection
						console.log("🔄 Connection closed, waiting for reconnection...");
					} else {
						reject(new Error("Connection closed with 401"));
					}
				}
			});

			// Timeout after 60 seconds
			setTimeout(() => {
				if (sock.user) {
					console.log("✅ Socket appears ready (timeout reached but user exists)");
					resolve();
				} else {
					console.log("⚠️ Connection timeout, but attempting to proceed...");
					resolve();
				}
			}, 60000);
		});

		// 3. Fetch all members
		const members = await memberCollection.find({}).toArray();
		console.log(`📊 Found ${members.length} members to migrate`);

		let updatedCount = 0;
		let errorCount = 0;
		let skippedCount = 0;

		// Filter members that need migration
		const membersToMigrate = members.filter(
			(m) => typeof m._id === "string" && !m.lid && m._id.endsWith("@s.whatsapp.net")
		);
		console.log(`🔄 Members needing migration: ${membersToMigrate.length}`);
		skippedCount = members.length - membersToMigrate.length;

		const CONCURRENCY = 10;

		for (let i = 0; i < membersToMigrate.length; i += CONCURRENCY) {
			const batch = membersToMigrate.slice(i, i + CONCURRENCY);

			await Promise.all(
				batch.map(async (member) => {
					const jid = member._id;
					try {
						const result = await sock.onWhatsApp(jid);
						const pn = extractPhoneNumber(jid);
						let lid = null;

						if (result && result[0]) {
							lid = result[0].lid;
						}

						// Update phoneNumber and LID if available
						await memberCollection.updateOne(
							{ _id: jid },
							{
								$set: {
									phoneNumber: pn,
									...(lid ? { lid: lid } : {}),
								},
							}
						);
						updatedCount++;
					} catch (err) {
						console.error(`❌ Error migrating ${jid}:`, err.message);
						errorCount++;
					}
				})
			);

			if (i % 100 === 0) {
				console.log(
					`✅ Processed ${Math.min(i + CONCURRENCY, membersToMigrate.length)} / ${
						membersToMigrate.length
					} (Updated: ${updatedCount})`
				);
			}

			// Rate limit
			await new Promise((r) => setTimeout(r, 200));
		}

		console.log(`\n🎉 Migration Completed!`);
		console.log(`✅ Updated: ${updatedCount}`);
		console.log(`⏩ Skipped: ${skippedCount}`);
		console.log(`❌ Errors: ${errorCount}`);
	} catch (err) {
		console.error("❌ Migration failed:", err);
	} finally {
		await mdClient.close();
		process.exit(0);
	}
};

migrate();
