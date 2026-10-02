import inshorts from "inshorts-api";
const readMore = String.fromCharCode(8206).repeat(4000);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { prefix, command, sendMessageWTyping } = msgInfoObj;

	let arr = [
		"national",
		"business",
		"sports",
		"world",
		"politics",
		"technology",
		"startup",
		"entertainment",
		"miscellaneous",
		"hatke",
		"science",
		"automobile",
	];

	if (command == "categories") {
		return sendMessageWTyping(
			from,
			{
				text: `📋 *News Categories*\n\n${arr.map((e, i) => `${i + 1}. ${e.charAt(0).toUpperCase() + e.slice(1)}`).join("\n")}\n\n_Usage: news <category>_`,
			},
			{ quoted: msg }
		);
	}

	let newsType = args[0] || "";

	if (!arr.includes(newsType) && newsType != "") {
		return sendMessageWTyping(
			from,
			{ text: `❌ *Invalid category:* _${newsType}_\n\nUse *${prefix}categories* to see all available categories.` },
			{ quoted: msg }
		);
	}

	var options = {
		lang: "en",
		category: newsType,
		numOfResults: 10,
	};

	inshorts.get(options, function (result) {
		if (!Array.isArray(result) || result.length === 0) {
			return sendMessageWTyping(from, { text: `❌ Failed to fetch news. Try again.` }, { quoted: msg });
		}
		const category = newsType === "" ? "Top Stories" : newsType.charAt(0).toUpperCase() + newsType.slice(1);
		let message = `📰 *${category} News*\n${readMore}`;
		result.forEach((news, i) => {
			message += `${i + 1}. *${news.title}*\n   _— ${news.author}_\n\n`;
		});
		sendMessageWTyping(from, { text: message }, { quoted: msg });
	});
};

export default () => ({
	cmd: ["news", "categories", "cate"],
	desc: "Get the latest news, optionally by category.",
	usage: "news | news <category> | categories",
	handler,
});
