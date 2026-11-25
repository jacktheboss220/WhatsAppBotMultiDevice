import axios from "axios";
import { askHeavy } from "../../utils/chat.js";

const GOOGLE_API_KEY_SEARCH = process.env.GOOGLE_API_KEY_SEARCH || "";
const SEARCH_ENGINE_KEY = process.env.SEARCH_ENGINE_KEY || "";

const baseURL = "https://www.googleapis.com/customsearch/v1";
const maxResults = 5; // Limiting to 5 results for better readability

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
  if (!GOOGLE_API_KEY_SEARCH || !SEARCH_ENGINE_KEY) {
    return sendMessageWTyping(
      from,
      { text: "```Google API Key or Search Engine Key is Missing```" },
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

  // Construct URL for Google Custom Search API
  const urlToSearch = `${baseURL}?key=${GOOGLE_API_KEY_SEARCH}&cx=${SEARCH_ENGINE_KEY}&q=${encodeURIComponent(
    searchQuery,
  )}`;

  try {
    const response = await axios.get(urlToSearch, { timeout: 8000 });

    // Extract search results
    const searchResults = response.data?.items?.slice(0, maxResults); // Limiting results to 'maxResults'

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
    console.error("Error during Google search:", error);
    sendMessageWTyping(from, { text: "```Error occurred while searching```" }, { quoted: msg });
  }
};

export default () => ({
  cmd: ["search", "gs"],
  desc: "Search Google and show the top results.",
  usage: "search | gs <query>",
  handler,
});
