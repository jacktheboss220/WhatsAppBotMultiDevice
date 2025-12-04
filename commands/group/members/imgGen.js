import dotenv from "dotenv";
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, evv } = msgInfoObj;

	if (!GOOGLE_API_KEY) {
		return sendMessageWTyping(from, { text: "```Google API Key is Missing```" }, { quoted: msg });
	}

	if (!args[0]) {
		return sendMessageWTyping(
			from,
			{ text: "Please provide a prompt to generate an image from." },
			{ quoted: msg }
		);
	}

	try {
		const model = genAI.getGenerativeModel({ model: "imagen-3.0" });

		const result = await model.generateImage({
			prompt: evv,
			// quality options: "standard" | "high"
			// high = best quality but slower
			size: "1024x1024",
			n: 1,
		});

		const image = result.response.images?.[0];

		if (!image) {
			return sendMessageWTyping(from, { text: "Something went wrong." }, { quoted: msg });
		}

		// Gemini returns base64
		const imageBuffer = Buffer.from(image.base64, "base64");

		await sendMessageWTyping(from, { image: imageBuffer }, { quoted: msg });
	} catch (err) {
		console.log("Gemini Error:", err);
		return sendMessageWTyping(from, { text: "Something went wrong." }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["make", "gen"],
	desc: "Generate an image from a prompt using Google Gemini",
	usage: "gen <prompt>",
	handler,
});
