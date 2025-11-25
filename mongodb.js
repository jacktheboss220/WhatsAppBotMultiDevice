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
	} catch (err) {
		console.error("Error connecting to MongoDB:", err);
	}
})();

export default mdClient;
