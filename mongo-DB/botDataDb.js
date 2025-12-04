import mdClient from "../mongodb.js";

mdClient.connect();

const bot = mdClient.db("MyBotDataDB").collection("AuthTable");

const createBotData = async () => {
	try {
		const res = await bot.findOne({ _id: "bot" });
		if (res == null) {
			await bot.insertOne({
				_id: "bot",
				youtube_session: "",
			});
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
		return -1;
	}
};

export { getBotData, createBotData, bot };
