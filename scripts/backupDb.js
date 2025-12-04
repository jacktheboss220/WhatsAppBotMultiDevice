import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mdClient from '../mongodb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.join(__dirname, '../backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const backupCollection = async (collectionName) => {
    try {
        const collection = mdClient.db("MyBotDataDB").collection(collectionName);
        const data = await collection.find({}).toArray();
        const filePath = path.join(backupDir, `${collectionName}_${Date.now()}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Backup of ${collectionName} completed: ${filePath}`);
    } catch (err) {
        console.error(`❌ Error backing up ${collectionName}:`, err);
    }
};

const runBackup = async () => {
    try {
        await mdClient.connect();
        console.log("Connected to MongoDB for backup...");

        await backupCollection("Members");
        await backupCollection("Groups");
        await backupCollection("Bot"); // Assuming collection name is 'Bot' based on dbControl.js usage (botDataDb.js)

        console.log("🎉 All backups completed successfully!");
    } catch (err) {
        console.error("❌ Backup failed:", err);
    } finally {
        await mdClient.close();
    }
};

runBackup();
