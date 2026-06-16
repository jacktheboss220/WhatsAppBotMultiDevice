import tts from "google-tts-api";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { prefix, sendMessageWTyping, evv, content, extendedMessageOriginal } = msgInfoObj;
	let lang = "en";
	let message = "";

	// Check if there's text in args or quoted message
	if (args.length > 0 && args[0] !== "hin") {
		message = evv; // Use the full text after command
	} else if (extendedMessageOriginal?.quotedMessage) {
		message =
			extendedMessageOriginal.quotedMessage.conversation ||
			extendedMessageOriginal.quotedMessage.extendedTextMessage?.text ||
			"";
	} else if (evv) {
		message = evv;
	}

	// Handle Hindi language option
	if (args[0] === "hin") {
		lang = "hi";
		if (evv && evv.includes("hin")) {
			message = evv.split("hin")[1].trim();
		} else {
			// If "hin" is specified but no text follows, check quoted message
			if (extendedMessageOriginal?.quotedMessage) {
				message =
					extendedMessageOriginal.quotedMessage.conversation ||
					extendedMessageOriginal.quotedMessage.extendedTextMessage?.text ||
					"";
			}
		}
	}

	// Validate message
	if (!message || message.trim() === "") {
		return sendMessageWTyping(
			from,
			{
				text: `❌ Text is empty! \n\nUsage:\n• ${prefix}say <text>\n• ${prefix}say hin <hindi text>\n• Reply to a message with ${prefix}say`,
			},
			{ quoted: msg }
		);
	}

	// Check message length
	if (message.length >= 200) {
		return sendMessageWTyping(
			from,
			{ text: `❌ Text too long! Limit: ${message.length}/200 characters\nSend ${prefix}say <shorter text>` },
			{ quoted: msg }
		);
	}

	try {
		const url = await tts(message, lang, 0);

		if (!url) return sendMessageWTyping(from, { text: `❌ Error generating audio!` }, { quoted: msg });

		await sendMessageWTyping(
			from,
			{
				audio: { url: url },
				mimetype: "audio/mpeg",
				fileName: "eva.mp3",
			},
			{ quoted: msg }
		);
	} catch (error) {
		console.error("TTS Error:", error);
		return sendMessageWTyping(
			from,
			{ text: `❌ Error generating text-to-speech: ${error.message}` },
			{ quoted: msg }
		);
	}
};

export default () => ({
	cmd: ["say", "tts"],
	desc: "Convert text to speech (supports English and Hindi)",
	usage: "say <text> | say hin <hindi text> | Reply to message with say",
	handler,
});
