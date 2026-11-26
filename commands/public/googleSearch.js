import axios from "axios";
import { askHeavy } from "../../utils/chat.js";

const GOOGLE_API_KEY_SEARCH = process.env.GOOGLE_API_KEY_SEARCH || "";
const SEARCH_ENGINE_KEY = process.env.SEARCH_ENGINE_KEY || "";
// Optional Keenable provider (https://docs.keenable.ai), for when the Google
// Custom Search JSON API (closed to new customers, ends 2027-01-01) isn't available.
const KEENABLE_API_KEY = process.env.KEENABLE_API_KEY || "";
const KEENABLE_KEYLESS = /^(1|true|yes|on)$/i.test(process.env.KEENABLE_KEYLESS || "");
const SEARCH_PROVIDER = (process.env.SEARCH_PROVIDER || "").trim().toLowerCase();

const baseURL = "https://www.googleapis.com/customsearch/v1";
const keenableURL = "https://api.keenable.ai/v1/search";
const maxResults = 5; // Limiting to 5 results for better readability

const hasGoogle = () => Boolean(GOOGLE_API_KEY_SEARCH && SEARCH_ENGINE_KEY);
const hasKeenable = () => Boolean(KEENABLE_API_KEY || KEENABLE_KEYLESS);

// Google stays the provider whenever its keys are set, unless SEARCH_PROVIDER=keenable.
// Keenable is used only when the user configures it (a key, or KEENABLE_KEYLESS=true).
const pickProvider = () => {
  if (SEARCH_PROVIDER === "keenable" && hasKeenable()) return "keenable";
  if (hasGoogle()) return "google";
  if (hasKeenable()) return "keenable";
  return null;
};

// Both return [{ title, snippet, link }].
const searchGoogle = async (query) => {
  const urlToSearch = `${baseURL}?key=${GOOGLE_API_KEY_SEARCH}&cx=${SEARCH_ENGINE_KEY}&q=${encodeURIComponent(
    query,
  )}`;
  const response = await axios.get(urlToSearch, { timeout: 8000 });
  return (response.data?.items || []).slice(0, maxResults);
};

const searchKeenable = async (query) => {
  // Keyed: /v1/search with X-API-Key. Keyless (opt-in): /v1/search/public with an app title,
  // rate limited per IP. Keyed and keyless requests are both logged under Keenable's default policy.
  const headers = KEENABLE_API_KEY
    ? { "X-API-Key": KEENABLE_API_KEY }
    : { "X-Keenable-Title": "WhatsAppBotMultiDevice" };
  const response = await axios.post(
    KEENABLE_API_KEY ? keenableURL : `${keenableURL}/public`,
    { query, max_results: maxResults, snippet_max_length: 300 },
    { headers, timeout: 8000 },
  );
  return (response.data?.results || [])
    .filter((r) => r?.url)
    .slice(0, maxResults)
    .map((r) => ({
      title: r.title || r.url,
      snippet: r.snippet || r.description || "",
      link: r.url,
    }));
};

const ANSWER_SYSTEM = `Answer the user's query in 1-3 short sentences using ONLY the search results given. If they don't contain the answer, reply exactly: NO_ANSWER. Plain text, no markdown.`;

// Short answer grounded in the snippets; null when the model can't answer or is unavailable.
const answerFromResults = async (query, results) => {
  try {
    const context = results.map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`).join("\n");
    const answer = await askHeavy(
      [
        { role: "system", content: ANSWER_SYSTEM },
        { role: "user", content: `Query: ${query}\n\nResults:\n${context}` },
      ],
      { maxTokens: 200 },
    );
    return answer.includes("NO_ANSWER") ? null : answer;
  } catch (err) {
    console.error("search answer failed:", err.message);
    return null;
  }
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping, evv, extendedMessageOriginal } = msgInfoObj;

  // Check if API keys are missing
  const provider = pickProvider();
  if (!provider) {
    return sendMessageWTyping(
      from,
      { text: "```Google API Key or Search Engine Key is Missing (or set KEENABLE_API_KEY)```" },
      { quoted: msg },
    );
  }

  // Check if there's no query provided
  if (!args[0] && !extendedMessageOriginal) {
    return sendMessageWTyping(from, { text: "```Enter Word to Search```" }, { quoted: msg });
  }

  // Extract search query from quoted message or direct input
  let searchQuery = evv || extendedMessageOriginal?.quotedMessage?.conversation;

  if (!searchQuery)
    return sendMessageWTyping(from, { text: "```Enter Word to Search```" }, { quoted: msg });

  try {
    const searchResults =
      provider === "keenable" ? await searchKeenable(searchQuery) : await searchGoogle(searchQuery);

    if (searchResults && searchResults.length > 0) {
      // Format and prepare message to send
      const answer = await answerFromResults(searchQuery, searchResults);
      let message = answer ? `*Answer*: ${answer}\n\n` : "";
      searchResults.forEach((result) => {
        message += `*Title*: ${result.title}\n*Snippet*: ${result.snippet}\n*Link*: ${result.link}\n\n`;
      });

      sendMessageWTyping(from, { text: message }, { quoted: msg });
    } else {
      sendMessageWTyping(from, { text: "```No Results Found```" }, { quoted: msg });
    }
  } catch (error) {
    console.error(`Error during ${provider} search:`, error.message);
    sendMessageWTyping(from, { text: "```Error occurred while searching```" }, { quoted: msg });
  }
};

export default () => ({
  cmd: ["search", "gs"],
  desc: "Search the web (Google, or Keenable if configured) and show the top results.",
  usage: "search | gs <query>",
  handler,
});
