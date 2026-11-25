import axios from "axios";
import { askHeavy } from "../../utils/chat.js";

const TIP_SYSTEM = `Give one short sentence (max 20 words) of practical advice for someone heading out in this weather, such as clothing, umbrella or sun protection. Plain text, no emoji.`;

// One-line advice from the numbers above; null when the model is unavailable.
const weatherTip = async (summary) => {
  try {
    return await askHeavy(
      [
        { role: "system", content: TIP_SYSTEM },
        { role: "user", content: summary },
      ],
      { maxTokens: 60 },
    );
  } catch (err) {
    console.error("weather tip failed:", err.message);
    return null;
  }
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping, prefix } = msgInfoObj;

  if (!args[0])
    return sendMessageWTyping(
      from,
      { text: `❌ Provide a city name.\n_Usage: ${prefix}weather <city>_` },
      { quoted: msg },
    );

  const city = args.join(" ");

  try {
    const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      headers: { "User-Agent": "curl/7.68.0" },
      timeout: 8000,
    });

    const w = res.data.current_condition[0];
    const area = res.data.nearest_area[0];
    const areaName = area.areaName[0].value;
    const country = area.country[0].value;

    const tempC = w.temp_C;
    const tempF = w.temp_F;
    const feelsC = w.FeelsLikeC;
    const humidity = w.humidity;
    const wind = w.windspeedKmph;
    const windDir = w.winddir16Point;
    const visibility = w.visibility;
    const desc = w.weatherDesc[0].value;
    const uvIndex = w.uvIndex;

    const weatherEmoji = getWeatherEmoji(desc);

    const tip = await weatherTip(
      `${areaName}: ${desc}, ${tempC}°C (feels ${feelsC}°C), humidity ${humidity}%, wind ${wind} km/h, UV ${uvIndex}`,
    );
    const text =
      `${weatherEmoji} *Weather — ${areaName}, ${country}*\n\n` +
      `🌡️ *Temperature:* ${tempC}°C / ${tempF}°F\n` +
      `🤔 *Feels Like:* ${feelsC}°C\n` +
      `☁️ *Condition:* ${desc}\n` +
      `💧 *Humidity:* ${humidity}%\n` +
      `💨 *Wind:* ${wind} km/h ${windDir}\n` +
      `👁️ *Visibility:* ${visibility} km\n` +
      `☀️ *UV Index:* ${uvIndex}` +
      (tip ? `\n\n💡 _${tip}_` : "");

    sendMessageWTyping(from, { text }, { quoted: msg });
  } catch (err) {
    if (err.response?.status === 404 || err.message?.includes("404")) {
      return sendMessageWTyping(from, { text: `❌ City *${city}* not found.` }, { quoted: msg });
    }
    console.error("weather error:", err);
    sendMessageWTyping(from, { text: `❌ Failed to fetch weather. Try again.` }, { quoted: msg });
  }
};

function getWeatherEmoji(desc) {
  const d = desc.toLowerCase();
  if (d.includes("thunder")) return "⛈️";
  if (d.includes("snow")) return "❄️";
  if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
  if (d.includes("cloud") || d.includes("overcast")) return "☁️";
  if (d.includes("fog") || d.includes("mist")) return "🌫️";
  if (d.includes("sunny") || d.includes("clear")) return "☀️";
  if (d.includes("partly")) return "⛅";
  return "🌤️";
}

export default () => ({
  cmd: ["weather", "w"],
  desc: "Get the current weather for a city.",
  usage: "weather <city>",
  handler,
});
