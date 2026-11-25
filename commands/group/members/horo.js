import * as cheerio from "cheerio";
import axios from "axios";
import { askHeavy } from "../../../utils/chat.js";

const signs = {
  aries: 1,
  taurus: 2,
  gemini: 3,
  cancer: 4,
  leo: 5,
  virgo: 6,
  libra: 7,
  scorpio: 8,
  sagittarius: 9,
  capricorn: 10,
  aquarius: 11,
  pisces: 12,
};

const URL =
  "https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign=";

const LANGS = { hindi: "Hindi (Devanagari)", hinglish: "Hinglish (Hindi in Roman script)" };

const translateReading = (reading, lang) =>
  askHeavy(
    [
      {
        role: "system",
        content: `Translate this horoscope into ${LANGS[lang]}. Keep the meaning and tone. Reply with only the translation.`,
      },
      { role: "user", content: reading },
    ],
    { maxTokens: 500 },
  );

const getHoroscope = async (sign) => {
  const res = await axios.get(URL + sign, { timeout: 8000 });
  const $ = cheerio.load(res.data);
  const horoscope = $(
    "body > div.grid.grid-right-sidebar > main > div.main-horoscope > p:nth-child(2)",
  ).text();
  return horoscope;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping } = msgInfoObj;

  if (args.length < 1 || !args[0]) {
    return sendMessageWTyping(
      from,
      {
        text: `⭐ *Horoscope Signs*\n\n${Object.keys(signs)
          .map((s) => `• ${s.charAt(0).toUpperCase() + s.slice(1)}`)
          .join("\n")}\n\n_Usage: horo <sign>_`,
      },
      { quoted: msg },
    );
  }

  let h_Low = args[0].toLowerCase();
  const lang = args[1]?.toLowerCase();
  if (lang && !LANGS[lang]) {
    return sendMessageWTyping(
      from,
      {
        text: `❌ Unknown language _${args[1]}_. Use *hindi* or *hinglish*, or leave it out for English.`,
      },
      { quoted: msg },
    );
  }

  if (!Object.keys(signs).includes(h_Low)) {
    sendMessageWTyping(
      from,
      {
        text: `❌ *Invalid sign:* _${args[0]}_\n\n*Valid signs:*\n${Object.keys(signs)
          .map((s) => `• ${s}`)
          .join("\n")}`,
      },
      { quoted: msg },
    );
  } else {
    getHoroscope(signs[h_Low])
      .then(async (res) => {
        let reading = res.trim().replace(/^[A-Za-z]{3,9}\s\d{1,2},\s\d{4}\s*-\s*/, "");
        if (lang) {
          // the scraped text is the source of truth; if translation fails the English reading is sent
          try {
            reading = await translateReading(reading, lang);
          } catch (err) {
            console.error("horo translate failed:", err.message);
          }
        }
        sendMessageWTyping(
          from,
          {
            text: `♈ *${h_Low.charAt(0).toUpperCase() + h_Low.slice(1)} Horoscope*\n📅 *Date:* ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n\n${reading}`,
          },
          { quoted: msg },
        );
      })
      .catch((err) => {
        console.error(err);
        sendMessageWTyping(
          from,
          { text: "❌ Failed to fetch horoscope. Try again." },
          { quoted: msg },
        );
      });
  }
};

export default () => ({
  cmd: ["horo", "horoscope"],
  desc: "Get today's horoscope for a zodiac sign, in English, Hindi or Hinglish.",
  usage: "horo <sign> [hindi|hinglish] | " + Object.keys(signs).join(", "),
  handler,
});
