const ytdl = require("ytdl-core");
const fs = require("fs");
const getRandom = (ext) => {
	return `${Math.floor(Math.random() * 10000)}${ext}`;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	if (!args[0]) return sendMessageWTyping(from, { text: `❎ *Enter Youtube link*` }, { quoted: msg });

	(async () => {
		try {
			let sany = getRandom(".mp3");
			const stream = ytdl(args[0], {
				filter: (info) => info.audioBitrate == 160 || info.audioBitrate == 128,
			}).pipe(fs.createWriteStream(sany));
			console.log("Audio downloaded");
			await new Promise((resolve, reject) => {
				stream.on("error", reject);
				stream.on("finish", resolve);
			})
				.then(async (res) => {
					await sock
						.sendMessage(
							from,
							{
								audio: fs.readFileSync(sany),
							},
							{ quoted: msg }
						)
						.then(() => {
							console.log("Sent");
							try {
								fs.unlinkSync(sany);
							} catch {}
						});
				})
				.catch((err) => {
					console.log(err);
				});
		} catch (err) {
			console.log(err);
			sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
		}
	})();
};

module.exports.command = () => ({
	cmd: ["yta"],
	desc: "Download youtube audio",
	usage: "yta <youtube link>",
	handler,
});
