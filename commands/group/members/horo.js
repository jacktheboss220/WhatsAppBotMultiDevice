import * as cheerio from "cheerio";
import axios from "axios";

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

const URL = "https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign=";

const getHoroscope = async (sign) => {
	const res = await axios.get(URL + sign);
	const $ = cheerio.load(res.data);
	const horoscope = $("body > div.grid.grid-right-sidebar > main > div.main-horoscope > p:nth-child(2)").text();
	return horoscope;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	if (args.length < 1 || !args[0]) {
		return sendMessageWTyping(
			from,
			{ text: `⭐ *Horoscope Signs*\n\n${Object.keys(signs).map(s => `• ${s.charAt(0).toUpperCase() + s.slice(1)}`).join("\n")}\n\n_Usage: horo <sign>_` },
			{ quoted: msg }
		);
	}

	let h_Low = args[0].toLowerCase();

	if (!Object.keys(signs).includes(h_Low)) {
		sendMessageWTyping(
			from,
			{ text: `❌ *Invalid sign:* _${args[0]}_\n\n*Valid signs:*\n${Object.keys(signs).map(s => `• ${s}`).join("\n")}` },
			{ quoted: msg }
		);
	} else {
		getHoroscope(signs[h_Low]).then((res) => {
			const reading = res.trim().replace(/^[A-Za-z]{3,9}\s\d{1,2},\s\d{4}\s*-\s*/, "");
			sendMessageWTyping(
				from,
				{
					text: `♈ *${h_Low.charAt(0).toUpperCase() + h_Low.slice(1)} Horoscope*\n📅 *Date:* ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n\n${reading}`,
				},
				{ quoted: msg }
			);
		}).catch((err) => {
			console.error(err);
			sendMessageWTyping(from, { text: "❌ Failed to fetch horoscope. Try again." }, { quoted: msg });
		});
	}
};

export default () => ({
	cmd: ["horo", "horoscope"],
	desc: "Get horoscope",
	usage: "horo <sign> | " + Object.keys(signs).join(", "),
	handler,
});
