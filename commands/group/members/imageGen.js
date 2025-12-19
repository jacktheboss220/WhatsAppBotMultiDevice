import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { writeFile } from "fs/promises";
import memoryManager from "../../../functions/memoryUtils.js";
import { getGroupData } from "../../../mongo-DB/groupDataDb.js";

const getRandom = (ext) => {
	return memoryManager.generateTempFileName(ext);
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	// Check if GOOGLE_API_KEY is available
	if (!process.env.GOOGLE_API_KEY) {
		return sendMessageWTyping(
			from,
			{ text: "❎ GOOGLE_API_KEY not configured. Please set it in your environment variables." },
			{ quoted: msg }
		);
	}

	// Check if image generation is enabled in the group
	const data = await getGroupData(from);
	if (!data.isImgOn) {
		return sendMessageWTyping(
			from,
			{ text: "```By Default Image Generation is Disabled in this group.```" },
			{ quoted: msg }
		);
	}

	// Parse arguments: gen <ratio> <prompt>
	if (args.length < 2) {
		return sendMessageWTyping(
			from,
			{
				text: "❎ *Usage:* gen <ratio> <prompt>\n\n*Ratios:* 1:1, 16:9, 9:16, 4:3, 3:4\n*Example:* gen 16:9 a beautiful sunset over mountains",
			},
			{ quoted: msg }
		);
	}

	const ratio = args[0];
	const validRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

	if (!validRatios.includes(ratio)) {
		return sendMessageWTyping(
			from,
			{
				text: `❎ Invalid ratio. Valid ratios are: ${validRatios.join(
					", "
				)}\n\n*Example:* gen 16:9 a beautiful sunset over mountains`,
			},
			{ quoted: msg }
		);
	}

	const prompt = args.slice(1).join(" ");

	if (prompt.length < 3) {
		return sendMessageWTyping(
			from,
			{ text: "❎ Please provide a descriptive prompt for the image." },
			{ quoted: msg }
		);
	}

	// Send processing message
	await sendMessageWTyping(
		from,
		{ text: `⏳ Generating image with ratio ${ratio}...\nPrompt: ${prompt}` },
		{ quoted: msg }
	);

	const fileName = getRandom(".jpeg");

	try {
		const ai = new GoogleGenAI({
			apiKey: process.env.GOOGLE_API_KEY,
		});

		const response = await ai.models.generateImages({
			model: "models/imagen-4.0-generate-001",
			prompt: prompt,
			config: {
				numberOfImages: 1,
				outputMimeType: "image/jpeg",
				personGeneration: PersonGeneration.ALLOW_ALL,
				aspectRatio: ratio,
				imageSize: "1K",
			},
		});

		if (!response?.generatedImages || response.generatedImages.length === 0) {
			throw new Error("No images generated from API");
		}

		const imageData = response.generatedImages[0];

		if (!imageData?.image?.imageBytes) {
			throw new Error("No image data received");
		}

		// Convert base64 to buffer and save
		const buffer = Buffer.from(imageData.image.imageBytes, "base64");
		await writeFile(fileName, buffer);

		// Send the generated image
		await sendMessageWTyping(
			from,
			{
				image: fileName,
				caption: `✅ Generated with Gemini Imagen 4.0\n📝 Prompt: ${prompt}\n📐 Ratio: ${ratio}`,
			},
			{ quoted: msg }
		);

		// Clean up the file
		memoryManager.safeUnlink(fileName);
	} catch (error) {
		console.error("Image generation error:", error);

		let errorMsg = "❎ Failed to generate image. ";

		if (error.message?.includes("quota")) {
			errorMsg += "API quota exceeded. Please try again later.";
		} else if (error.message?.includes("API key")) {
			errorMsg += "Invalid API key.";
		} else if (error.message?.includes("safety")) {
			errorMsg += "Image rejected due to safety filters. Try a different prompt.";
		} else {
			errorMsg += error.message || "Unknown error occurred.";
		}

		await sendMessageWTyping(from, { text: errorMsg }, { quoted: msg });

		// Clean up file if it exists
		memoryManager.safeUnlink(fileName);
	}
};

export default () => ({
	cmd: ["gen", "genimg", "imagen"],
	desc: "Generate image from text prompt using Google Gemini Imagen 4.0 API",
	usage: "gen <ratio> <prompt>",
	handler,
});
