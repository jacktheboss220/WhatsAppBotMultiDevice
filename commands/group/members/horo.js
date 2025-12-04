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
		return sock.sendMessage(
			from,
			{ text: "Please provide right horoscopes : " + Object.keys(signs).join("\n") },
			{ quoted: msg }
		);
	}

	let h_Low = args[0].toLowerCase();

	if (!Object.keys(signs).includes(h_Low)) {
		sendMessageWTyping(
			from,
			{ text: "Kindly enter the right spelling of " + Object.keys(signs).join(", ") },
			{ quoted: msg }
		);
	} else {
		getHoroscope(signs[h_Low]).then((res) => {
			sendMessageWTyping(
				from,
				{
					text:
						"*Data*: " +
						new Date().toLocaleDateString() +
						"\n" +
						"*Nature Hold's For You*: " +
						res.split("-")[1],
				},
				{ quoted: msg }
			);
		});
	}
};

export default () => ({
	cmd: ["horo", "horoscope"],
	desc: "Get horoscope",
	usage: "horo <sign> | " + Object.keys(signs).join(", "),
	handler,
});
