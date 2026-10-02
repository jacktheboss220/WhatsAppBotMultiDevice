import mdClient from "./client.js";

const bot = mdClient.db("MyBotDataDB").collection("AuthTable");

const createBotData = async () => {
	try {
		const res = await bot.findOne({ _id: "bot" });
		if (res == null) {
			await bot.insertOne({
				_id: "bot",
				youtube_session: "",
				disabledGlobally: [],
			});
		} else if (!res.disabledGlobally) {
			await bot.updateOne({ _id: "bot" }, { $set: { disabledGlobally: [] } });
		}
	} catch (err) {
		console.log(err);
	}
};

const getBotData = async () => {
	try {
		const res = await bot.findOne({ _id: "bot" });
		return res;
	} catch (err) {
		console.error("[botDataDb error]", err.message);
		return null;
	}
};

export { getBotData, createBotData, bot };
