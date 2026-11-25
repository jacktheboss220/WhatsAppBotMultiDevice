import axios from "axios";
import { askHeavy } from "../../../utils/chat.js";

const DICT_SYSTEM = `You are a dictionary. The user gives a word or phrase (English, Hindi, Hinglish or slang). Reply in this exact WhatsApp format, using *single asterisks* for bold, no headers:
*Term:* ...
*Type:* ...
*Meaning:* ...
*Example:* _..._
If it is not a real word or phrase, reply with exactly: NOT_FOUND`;

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping } = msgInfoObj;

  if (!args[0]) {
    return sendMessageWTyping(from, { text: `*Please enter a word to search.*` }, { quoted: msg });
  }

  const word = args[0];

  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
      timeout: 8000,
    });

    const data = response.data[0];

    const term = data.word || word;
    const pronunciation = data.phonetic || data.phonetics?.[0]?.text || "N/A";

    const meaningObj = data.meanings?.[0];
    const partOfSpeech = meaningObj?.partOfSpeech || "N/A";

    const definition = meaningObj?.definitions?.[0]?.definition || "No definition found.";
    const example = meaningObj?.definitions?.[0]?.example || "No example available.";

    const text = `*📚 Dictionary Result*

*Term:* ${term}
*Pronunciation:* ${pronunciation}
*Type:* ${partOfSpeech}

*Meaning:* 
${definition}

*Example:* 
_${example}_`;

    await sendMessageWTyping(from, { text }, { quoted: msg });
  } catch {
    // dictionaryapi.dev is English-only: let the LLM try Hindi, Hinglish, slang and phrases
    try {
      const answer = await askHeavy(
        [
          { role: "system", content: DICT_SYSTEM },
          { role: "user", content: args.join(" ").slice(0, 100) },
        ],
        { maxTokens: 300 },
      );
      if (!answer.includes("NOT_FOUND"))
        return sendMessageWTyping(
          from,
          { text: `*📚 Dictionary Result*\n\n${answer}` },
          { quoted: msg },
        );
    } catch (llmErr) {
      console.error("dictionary LLM fallback failed:", llmErr.message);
    }
    return sendMessageWTyping(
      from,
      { text: `Couldn't find the word *${word}*. Try another one.` },
      { quoted: msg },
    );
  }
};

export default () => ({
  cmd: ["dictionary", "dict"],
  desc: "Look up the meaning of a word (English, Hindi, Hinglish or slang).",
  usage: "dict <word>",
  handler,
});
