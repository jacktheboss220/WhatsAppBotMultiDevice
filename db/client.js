import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_KEY;
const mdClient = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

(async () => {
	try {
		await mdClient.connect();
		console.log("Connected to MongoDB");

		const db = mdClient.db("MyBotDataDB");
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map((col) => col.name);

		if (!collectionNames.includes("AuthTable")) {
			await db.createCollection("AuthTable");
			console.log("Created AuthTable collection");
		}

		// Index for group member queries ($inc / $set by members.id)
		// Use sparse: true to match any existing index definition and avoid conflicts
		await db.collection("Groups").createIndex({ "members.id": 1 }, { background: true, sparse: true });
	} catch (err) {
		console.error("Error connecting to MongoDB:", err);
	}
})();

export default mdClient;
