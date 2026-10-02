import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	let url = "https://zenquotes.io/api/random";
	try {
		const res = await axios(url, { timeout: 8000 });
		const { q, a } = res.data[0];
		sendMessageWTyping(from, { text: `✨ *Quote of the Day*\n\n_"${q}"_\n\n— *${a}*` }, { quoted: msg });
	} catch (err) {
		console.error("quote error:", err);
		sendMessageWTyping(from, { text: `❌ Failed to fetch quote. Try again.` }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["quote"],
	desc: "Get a random quote.",
	usage: "quote",
	handler,
});
