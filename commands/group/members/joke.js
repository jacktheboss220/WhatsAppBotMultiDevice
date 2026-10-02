import axios from "axios";
const baseURL = "https://v2.jokeapi.dev";
const cate = ["Programming", "Misc", "Dark", "Pun", "Spooky", "Christmas"];

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	let take = args[0] ? args[0].slice(0, 1).toUpperCase() + args[0].slice(1) : "Any";

	const categories = !take ? "Any" : take;
	if (categories != "Any" && !cate.includes(take))
		return sendMessageWTyping(
			from,
			{ text: `❌ *Invalid category:* _${take}_\n\n*Available categories:*\n${cate.map(c => `• ${c}`).join("\n")}` },
			{ quoted: msg }
		);

	try {
		axios
			.get(`${baseURL}/joke/${categories}`, { timeout: 8000 })
			.then((res) => {
				let randomJoke = res.data;
				let mess = "";
				if (randomJoke.type == "single") {
					mess = `😂 *Joke*\n🏷️ *Category:* ${randomJoke.category}\n\n${randomJoke.joke}`;
					sendMessageWTyping(from, { text: mess }, { quoted: msg });
				} else {
					mess = `😂 *Joke*\n🏷️ *Category:* ${randomJoke.category}\n\n${randomJoke.setup}\n\n😄 ${randomJoke.delivery}`;
					sendMessageWTyping(from, { text: mess }, { quoted: msg });
				}
			})
			.catch((err) => {
				console.log("error : ", err);
				sendMessageWTyping(from, { text: `❌ Failed to fetch joke. Try again.` }, { quoted: msg });
			});
	} catch (err) {
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
		console.log(err);
	}
};

export default () => ({
	cmd: ["joke"],
	desc: "Get a random joke, optionally from a category.",
	usage: "joke | joke <category>",
	handler,
});
