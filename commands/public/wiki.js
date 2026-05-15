import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, prefix } = msgInfoObj;

	if (!args[0])
		return sendMessageWTyping(from, { text: `❌ Provide a search term.\n_Usage: ${prefix}wiki <query>_` }, { quoted: msg });

	const query = args.join(" ");

	try {
		const searchRes = await axios.get("https://en.wikipedia.org/w/api.php", {
			params: {
				action: "query",
				list: "search",
				srsearch: query,
				format: "json",
				srlimit: 1,
			},
			timeout: 8000,
		});

		const results = searchRes.data.query.search;
		if (!results.length)
			return sendMessageWTyping(from, { text: `❌ No Wikipedia results for *${query}*.` }, { quoted: msg });

		const pageId = results[0].pageid;
		const title = results[0].title;

		const summaryRes = await axios.get("https://en.wikipedia.org/w/api.php", {
			params: {
				action: "query",
				pageids: pageId,
				prop: "extracts",
				exintro: true,
				explaintext: true,
				format: "json",
			},
			timeout: 8000,
		});

		let extract = summaryRes.data.query.pages[pageId].extract || "";
		// Trim to ~800 chars at sentence boundary
		if (extract.length > 800) {
			extract = extract.slice(0, 800);
			const lastDot = extract.lastIndexOf(".");
			if (lastDot > 400) extract = extract.slice(0, lastDot + 1);
			extract += "\n\n_...read more on Wikipedia_";
		}

		const url = `https://en.wikipedia.org/?curid=${pageId}`;
		sendMessageWTyping(
			from,
			{ text: `📖 *${title}*\n\n${extract}\n\n🔗 ${url}` },
			{ quoted: msg }
		);
	} catch (err) {
		console.error("wiki error:", err);
		sendMessageWTyping(from, { text: `❌ Failed to fetch Wikipedia data. Try again.` }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["wiki", "wikipedia"],
	desc: "Get Wikipedia summary for a topic",
	usage: "wiki <query>",
	handler,
});
