import dotenv from "dotenv";
dotenv.config();

const GOOGLE_API_KEY_SEARCH = process.env.GOOGLE_API_KEY_SEARCH || "";
const SEARCH_ENGINE_KEY = process.env.SEARCH_ENGINE_KEY || "";

import axios from "axios";
import { getGroupData } from "../../../db/groupData.js";
import { fetchImageBuffer } from "../../../utils/safeFetch.js";

const baseURL = "https://www.googleapis.com/customsearch/v1";
const googleapis = `?key=${GOOGLE_API_KEY_SEARCH}`;
const searchEngineKey = `&cx=${SEARCH_ENGINE_KEY}`;
const searchType = "&searchType=image";
const defQuery = "&q=";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv, extendedMessageOriginal } = msgInfoObj;

	if (!GOOGLE_API_KEY_SEARCH || !SEARCH_ENGINE_KEY)
		return sendMessageWTyping(
			from,
			{ text: "```Google API Key or Search Engine Key is Missing```" },
			{ quoted: msg }
		);

	const data = await getGroupData(from);

	if (!data?.isImgOn) {
		return sendMessageWTyping(
			from,
			{ text: "```By Default Search Image is Disable in this group.```" },
			{ quoted: msg }
		);
	}

	if (args[0]?.startsWith("@") && extendedMessageOriginal) {
		return sendMessageWTyping(from, { text: "```Enter Word to Search```" }, { quoted: msg });
	}

	// Never log this URL (it contains the API key, and logs are streamed to the dashboard);
	// encode the query so user text can't inject extra API parameters.
	const urlToSearch = `${baseURL}${googleapis}${searchEngineKey}${searchType}${defQuery}${encodeURIComponent(evv)}`;

	await axios(urlToSearch, { timeout: 8000 })
		.then(async (res) => {
			const links = res?.data?.items?.map((ele) => ele.link);
			sendImage(links, from, msg, { args, sendMessageWTyping });
		})
		.catch(() => {
			sendMessageWTyping(from, { text: "Error while fetching data" }, { quoted: msg });
		});
};

const MAX_TRIES = 3;

const sendImage = async (links, from, msg, { args, sendMessageWTyping }) => {
	if (!links?.length) {
		return sendMessageWTyping(from, { text: "No image found" }, { quoted: msg });
	}
	let random = 0;
	if (args[0] == "1") {
		random = 0;
	} else if (links.length > 5) {
		random = Math.floor(Math.random() * 5);
	}
	// The chosen result first, then the next ones: result links are arbitrary hosts, so some are dead, too big
	// or refused by the safe fetcher (private addresses, non-images). Skip those instead of failing the command.
	const candidates = [links[random], ...links.filter((_, i) => i !== random)].filter(Boolean).slice(0, MAX_TRIES);
	let image;
	for (const url of candidates) {
		try {
			image = await fetchImageBuffer(url);
			break;
		} catch (err) {
			console.log("[img] skipped a result:", err.message);
		}
	}
	if (!image) {
		return sendMessageWTyping(from, { text: "❌ Couldn't download an image for that search. Try another word." }, { quoted: msg });
	}
	await sendMessageWTyping(from, { image }, { quoted: msg });
};

export default () => ({
	cmd: ["img"],
	desc: "Search Google Images. Add a number to get that many results.",
	usage: "img <search word> | <number> (optional) <search word>",
	handler,
});
