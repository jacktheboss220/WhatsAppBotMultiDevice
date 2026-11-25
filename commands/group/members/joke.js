import axios from "axios";
import { askHeavy } from "../../../utils/chat.js";

const baseURL = "https://v2.jokeapi.dev";
const cate = ["Programming", "Misc", "Dark", "Pun", "Spooky", "Christmas"];
const MAX_TOPIC_CHARS = 100;

const JOKE_SYSTEM = `Write one short, funny joke about the user's topic, max 60 words. Keep it clean: no slurs, no sexual content, nothing targeting religion, caste, nationality, politics or real people. If the topic is in Hinglish or Hindi, write the joke in the same language. Plain text only, no preamble.`;

const fetchApiJoke = async (category) => {
  const { data } = await axios.get(`${baseURL}/joke/${category}`, { timeout: 8000 });
  const body = data.type == "single" ? data.joke : `${data.setup}\n\n😄 ${data.delivery}`;
  return `😂 *Joke*\n🏷️ *Category:* ${data.category}\n\n${body}`;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping } = msgInfoObj;
  const reply = (text) => sendMessageWTyping(from, { text }, { quoted: msg });

  const first = args[0] ? args[0].slice(0, 1).toUpperCase() + args[0].slice(1).toLowerCase() : "";
  // a category word keeps the API path; anything else is a topic for the model
  const isCategory = !args[0] || (args.length === 1 && cate.includes(first));
  const topic = args.join(" ").slice(0, MAX_TOPIC_CHARS);

  try {
    if (!isCategory) {
      try {
        const joke = await askHeavy(
          [
            { role: "system", content: JOKE_SYSTEM },
            { role: "user", content: topic },
          ],
          { maxTokens: 150 },
        );
        return reply(`😂 *Joke*\n🏷️ *Topic:* ${topic}\n\n${joke}`);
      } catch (err) {
        console.error("joke LLM failed, using API:", err.message);
      }
    }
    return reply(await fetchApiJoke(isCategory && args[0] ? first : "Any"));
  } catch (err) {
    console.error("joke error:", err);
    return reply("❌ Failed to fetch joke. Try again.");
  }
};

export default () => ({
  cmd: ["joke"],
  desc: "Get a joke: random, from a category, or about any topic you give.",
  usage: "joke | joke <category> | joke <topic>",
  handler,
});
