import { BufferJSON, initAuthCreds, proto } from "baileys";
import mdClient from "../mongodb.js";

/**
 * Custom MongoDB-based auth state implementation
 * Stores all authentication data in MongoDB instead of files
 */
const useMongoDBAuthState = async () => {
	const collectionName = "AuthState";
	const collection = mdClient.db("MyBotDataDB").collection(collectionName);

	// Helper to write data to MongoDB
	const writeData = async (key, data) => {
		try {
			await collection.updateOne(
				{ _id: key },
				{ $set: { value: JSON.stringify(data, BufferJSON.replacer) } },
				{ upsert: true }
			);
		} catch (error) {
			console.error(`Error writing auth data for key ${key}:`, error);
		}
	};

	// Helper to read data from MongoDB
	const readData = async (key) => {
		try {
			const doc = await collection.findOne({ _id: key });
			if (doc?.value) {
				return JSON.parse(doc.value, BufferJSON.reviver);
			}
			return null;
		} catch (error) {
			console.error(`Error reading auth data for key ${key}:`, error);
			return null;
		}
	};

	// Helper to remove data from MongoDB
	const removeData = async (key) => {
		try {
			const result = await collection.deleteOne({ _id: key });
			if (result.deletedCount > 0) {
				console.log(`🗑️ Removed old session key: ${key}`);
			}
		} catch (error) {
			console.error(`Error removing auth data for key ${key}:`, error);
		}
	};

	// Initialize or load credentials
	const creds = (await readData("creds")) || initAuthCreds();

	return {
		state: {
			creds,
			keys: {
				get: async (type, ids) => {
					// console.log(`📥 MongoDB get: ${type} (${ids.length} keys)`);
					const data = {};
					await Promise.all(
						ids.map(async (id) => {
							let value = await readData(`${type}-${id}`);
							if (type === "app-state-sync-key" && value) {
								value = proto.Message.AppStateSyncKeyData.fromObject(value);
							}
							data[id] = value;
						})
					);
					return data;
				},
				set: async (data) => {
					const tasks = [];
					let writeCount = 0;
					let deleteCount = 0;

					for (const category in data) {
						for (const id in data[category]) {
							const value = data[category][id];
							const key = `${category}-${id}`;

							if (value != null) {
								tasks.push(writeData(key, value));
								writeCount++;
							} else {
								tasks.push(removeData(key));
								deleteCount++;
							}
						}
					}

					await Promise.all(tasks);

					if (writeCount > 0 || deleteCount > 0) {
						console.log(`💾 MongoDB set: +${writeCount} writes, -${deleteCount} deletes`);
					}
				},
			},
		},
		saveCreds: async () => {
			await writeData("creds", creds);
		},
	};
};

/**
 * Clear all auth state from MongoDB
 */
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

/**
 * Get statistics about auth state storage
 */
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
