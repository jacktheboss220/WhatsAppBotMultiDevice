import { GoogleGenAI } from "@google/genai";
import { writeFile } from "fs/promises";
import mime from "mime";
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

	// Parse arguments: gen2 <ratio> <prompt>
	if (args.length < 2) {
		return sendMessageWTyping(
			from,
			{
				text: "❎ *Usage:* gen2 <ratio> <prompt>\n\n*Ratios:* 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 5:4, 4:5, 21:9\n*Example:* gen2 16:9 a beautiful sunset over mountains with vibrant colors",
			},
			{ quoted: msg }
		);
	}

	const ratio = args[0];
	const validRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9"];

	if (!validRatios.includes(ratio)) {
		return sendMessageWTyping(
			from,
			{
				text: `❎ Invalid ratio. Valid ratios are: ${validRatios.join(
					", "
				)}\n\n*Example:* gen2 16:9 a beautiful sunset over mountains with vibrant colors`,
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
		{ text: `⏳ Generating image with Gemini 2.5 Flash...\nPrompt: ${prompt}\nRatio: ${ratio}` },
		{ quoted: msg }
	);

	const generatedFiles = [];

	try {
		const ai = new GoogleGenAI({
			apiKey: process.env.GOOGLE_API_KEY,
		});

		const config = {
			responseModalities: ["IMAGE", "TEXT"],
			imageConfig: {
				aspectRatio: ratio,
			},
		};

		const model = "gemini-2.5-flash-image";

		const contents = [
			{
				role: "user",
				parts: [
					{
						text: prompt,
					},
				],
			},
		];

		const response = await ai.models.generateContentStream({
			model,
			config,
			contents,
		});

		let fileIndex = 0;
		let textResponse = "";

		for await (const chunk of response) {
			if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
				continue;
			}

			// Check for inline data (images)
			if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
				const inlineData = chunk.candidates[0].content.parts[0].inlineData;
				const fileExtension = mime.getExtension(inlineData.mimeType || "image/jpeg");
				const buffer = Buffer.from(inlineData.data || "", "base64");

				const fileName = getRandom(`.${fileExtension}`);
				await writeFile(fileName, buffer);
				generatedFiles.push(fileName);
				fileIndex++;
			} else if (chunk.text) {
				// Collect text response
				textResponse += chunk.text;
			}
		}

		// Send generated images
		if (generatedFiles.length > 0) {
			for (const fileName of generatedFiles) {
				await sendMessageWTyping(
					from,
					{
						image: fileName,
						caption: `✅ Generated with Gemini 2.5 Flash Image\n📝 Prompt: ${prompt}\n📐 Ratio: ${ratio}${
							textResponse ? `\n\n${textResponse}` : ""
						}`,
					},
					{ quoted: msg }
				);
			}
		} else if (textResponse) {
			// If only text was generated, send it
			await sendMessageWTyping(from, { text: `✅ Response:\n\n${textResponse}` }, { quoted: msg });
		} else {
			throw new Error("No images or text generated from API");
		}

		// Clean up the files
		generatedFiles.forEach((file) => memoryManager.safeUnlink(file));
	} catch (error) {
		console.error("Image generation error:", error);

		let errorMsg = "❎ Failed to generate image. ";

		if (error.message?.includes("quota")) {
			errorMsg += "API quota exceeded. Please try again later.";
		} else if (error.message?.includes("API key")) {
			errorMsg += "Invalid API key.";
		} else if (error.message?.includes("safety")) {
			errorMsg += "Image rejected due to safety filters. Try a different prompt.";
		} else if (error.message?.includes("not found") || error.message?.includes("model")) {
			errorMsg += "Model not available. The Gemini 2.5 Flash Image model may not be accessible yet.";
		} else {
			errorMsg += error.message || "Unknown error occurred.";
		}

		await sendMessageWTyping(from, { text: errorMsg }, { quoted: msg });

		// Clean up files if they exist
		generatedFiles.forEach((file) => memoryManager.safeUnlink(file));
	}
};

export default () => ({
	cmd: ["gen2", "genimg2", "flashgen"],
	desc: "Generate image from text prompt using Google Gemini 2.5 Flash Image model",
	usage: "gen2 <ratio> <prompt>",
	handler,
});
