import { BufferJSON, initAuthCreds, proto } from "baileys";
import mdClient from "../db/client.js";

const FLUSH_INTERVAL_MS = 5000; // non-critical flush
const MAX_BUFFER_SIZE = 500; // safety cap

const useMongoDBAuthState = async () => {
	const collection = mdClient.db("MyBotDataDB").collection("AuthState");

	// in-memory buffer for non-critical writes
	const buffer = new Map();
	let flushTimer = null;

	const CRITICAL_PREFIXES = ["creds", "session", "pre-key", "sender-key"];

	const isCritical = (key) => CRITICAL_PREFIXES.some((p) => key.startsWith(p));

	// ───────────────── READ ─────────────────
	const readData = async (key) => {
		const doc = await collection.findOne({ _id: key });
		if (!doc?.value) return null;
		return JSON.parse(doc.value, BufferJSON.reviver);
	};

	// ───────────────── WRITE (critical) ─────────────────
	const writeCriticalBulk = async (ops) => {
		if (!ops.length) return;
		await collection.bulkWrite(ops, { ordered: false });
	};

	// ───────────────── BUFFER (non-critical) ─────────────────
	const bufferWrite = (key, value) => {
		buffer.set(key, value);

		if (buffer.size >= MAX_BUFFER_SIZE) {
			flushBuffer().catch(() => {});
		}
	};

	const flushBuffer = async () => {
		if (!buffer.size) return;

		const ops = [];
		for (const [key, value] of buffer) {
			ops.push({
				updateOne: {
					filter: { _id: key },
					update: {
						$set: {
							value: JSON.stringify(value, BufferJSON.replacer),
						},
					},
					upsert: true,
				},
			});
		}

		const entries = [...buffer];
		buffer.clear();
		try {
			await collection.bulkWrite(ops, { ordered: false });
		} catch (err) {
			// put them back (unless newer values arrived meanwhile) so a failed flush isn't silent data loss
			for (const [k, v] of entries) if (!buffer.has(k)) buffer.set(k, v);
			throw err;
		}
	};

	// background flush loop
	flushTimer = setInterval(() => {
		flushBuffer().catch(() => {});
	}, FLUSH_INTERVAL_MS);

	// ───────────────── CREDS ─────────────────
	const creds = (await readData("creds")) || initAuthCreds();

	// ───────────────── STATE ─────────────────
	return {
		state: {
			creds,
			keys: {
				get: async (type, ids) => {
					const keys = ids.map((id) => `${type}-${id}`);
					const byKey = {};
					// Non-critical keys can still be waiting in the flush buffer: read those first, else a get
					// within 5s of a set returns stale/missing data.
					const missing = [];
					for (const key of keys) {
						if (buffer.has(key)) byKey[key] = buffer.get(key);
						else missing.push(key);
					}
					if (missing.length) {
						const docs = await collection.find({ _id: { $in: missing } }).toArray();
						for (const doc of docs) {
							if (doc?.value) byKey[doc._id] = JSON.parse(doc.value, BufferJSON.reviver);
						}
					}
					const data = {};
					for (const id of ids) {
						let value = byKey[`${type}-${id}`] ?? null;
						if (type === "app-state-sync-key" && value) {
							value = proto.Message.AppStateSyncKeyData.fromObject(value);
						}
						data[id] = value;
					}
					return data;
				},

				set: async (data) => {
					const criticalOps = [];

					for (const category in data) {
						for (const id in data[category]) {
							const value = data[category][id];
							const key = `${category}-${id}`;

							// Baileys signals deletion (used pre-keys, dropped sessions, ...) with null. These were skipped,
							// so nothing was ever removed. Drop any pending buffered write first so it can't resurrect the key.
							if (value == null) {
								buffer.delete(key);
								criticalOps.push({ deleteOne: { filter: { _id: key } } });
								continue;
							}

							if (isCritical(key)) {
								criticalOps.push({
									updateOne: {
										filter: { _id: key },
										update: {
											$set: {
												value: JSON.stringify(value, BufferJSON.replacer),
											},
										},
										upsert: true,
									},
								});
							} else {
								bufferWrite(key, value);
							}
						}
					}

					await writeCriticalBulk(criticalOps);
				},
			},
		},

		saveCreds: async () => {
			await collection.updateOne(
				{ _id: "creds" },
				{ $set: { value: JSON.stringify(creds, BufferJSON.replacer) } },
				{ upsert: true }
			);
		},

		// Cleanup function to prevent memory leaks on reconnection
		cleanup: () => {
			if (flushTimer) {
				clearInterval(flushTimer);
				flushTimer = null;
			}
			// Flush remaining buffer before clearing
			flushBuffer().catch(() => {});
			buffer.clear();
			console.log("🧹 Auth state cleanup completed");
		},
	};
};

const clearMongoDBAuthState = async () => {
	try {
		const collection = mdClient.db("MyBotDataDB").collection("AuthState");
		const result = await collection.deleteMany({});
		console.log(`🗑️ Cleared ${result.deletedCount} auth state documents from MongoDB`);
		return result.deletedCount;
	} catch (error) {
		console.error("Error clearing MongoDB auth state:", error);
		return 0;
	}
};

const getAuthStateStats = async () => {
	try {
		const collection = mdClient.db("MyBotDataDB").collection("AuthState");
		const count = await collection.countDocuments();

		// Count by type
		const types = await collection
			.aggregate([
				{
					$project: {
						type: {
							$arrayElemAt: [{ $split: ["$_id", "-"] }, 0],
						},
					},
				},
				{
					$group: {
						_id: "$type",
						count: { $sum: 1 },
					},
				},
			])
			.toArray();

		return {
			total: count,
			byType: types.reduce((acc, item) => {
				acc[item._id] = item.count;
				return acc;
			}, {}),
		};
	} catch (error) {
		console.error("Error getting auth state stats:", error);
		return { total: 0, byType: {} };
	}
};

export { useMongoDBAuthState, clearMongoDBAuthState, getAuthStateStats };
