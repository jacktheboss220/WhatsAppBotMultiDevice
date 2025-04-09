require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const axios = require("axios");

const getRandom = (ext) => {
	return `${Math.floor(Math.random() * 10000)}${ext}`;
};

const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { evv, sendMessageWTyping } = msgInfoObj;
	if (!args[0]) return sendMessageWTyping(from, { text: "Provide Twitter Video URL." }, { quoted: msg });
	let link = args[0];

	if (!link.startsWith("http"))
		return sendMessageWTyping(from, { text: "Provide Twitter Video URL." }, { quoted: msg });

	let url = `Direct link for ${evv}\n\n`;

	const fileDown = getRandom(".mp4");

	try {
		const tweetId = tweetUrl.split("/").pop().split("?")[0];
		const tweet = await client.v2.singleTweet(tweetId, {
			expansions: ["attachments.media_keys"],
			"media.fields": ["variants"],
		});

		const media = tweet.includes?.media?.[0];
		if (!media || media.type !== "video") {
			console.log("No video found in this tweet.");
			return;
		}

		const highestBitrateVariant = media.variants
			.filter((variant) => variant.content_type === "video/mp4")
			.reduce((prev, current) => (prev.bit_rate > current.bit_rate ? prev : current));

		const videoUrl = highestBitrateVariant.url;
		const response = await axios({
			url: videoUrl,
			method: "GET",
			responseType: "stream",
		});

		const writer = fs.createWriteStream(fileDown);
		response.data.pipe(writer);

		writer.on("finish", () => {
			console.log("Video downloaded successfully.");
			url += "🎬 " + videoUrl + "\n\n";
			sock.sendMessage(from, { video: fs.readFileSync(fileDown), mimetype: "video/mp4" }, { quoted: msg });
			fs.unlinkSync(fileDown);
		});

		writer.on("error", (err) => {
			console.error("Error downloading video:", err);
			sendMessageWTyping(from, { text: "Error downloading video." }, { quoted: msg });
			fs.unlinkSync(fileDown);
		});
	} catch (error) {
		console.error("Error fetching tweet:", error);
		sendMessageWTyping(
			from,
			{ text: `*Sorry* No Video Found\nCheck your _spelling or try another video_.` },
			{ quoted: msg }
		);
	}
};

module.exports.command = () => ({
	cmd: ["twitter", "tw", "x"],
	desc: "Download Twitter Video",
	usage: "twitter <tweet url>",
	handler,
});
