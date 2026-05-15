import mdClient from "../mongodb.js";

const chatLogs = mdClient.db("MyBotDataDB").collection("ChatLogs");

(async () => {
	try {
		await chatLogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 86400 });
		await chatLogs.createIndex({ groupJid: 1, timestamp: 1 });
	} catch (e) {
		console.error("[chatLogger] index error:", e.message);
	}
})();

export const saveChatMessage = async (groupJid, senderJid, senderName, text, replyTo = null, mentions = []) => {
	try {
		await chatLogs.insertOne({
			groupJid,
			sender: senderJid,
			senderName: senderName || "",
			text,
			replyTo,
			mentions,
			timestamp: new Date(),
		});
	} catch (e) {
		console.error("[chatLogger] save error:", e.message);
	}
};

export const getChatMessages = async (groupJid, hours = 24) => {
	try {
		const since = new Date(Date.now() - hours * 60 * 60 * 1000);
		return await chatLogs
			.find({ groupJid, timestamp: { $gte: since } })
			.sort({ timestamp: 1 })
			.toArray();
	} catch (e) {
		console.error("[chatLogger] fetch error:", e.message);
		return [];
	}
};
