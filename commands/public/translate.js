import axios from "axios";

const LANG_NAMES = {
	en: "English", hi: "Hindi", es: "Spanish", fr: "French", de: "German",
	ar: "Arabic", zh: "Chinese", ja: "Japanese", ko: "Korean", pt: "Portuguese",
	ru: "Russian", it: "Italian", tr: "Turkish", bn: "Bengali", ur: "Urdu",
	ta: "Tamil", te: "Telugu", mr: "Marathi", gu: "Gujarati", ml: "Malayalam",
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, prefix, extendedMessageOriginal } = msgInfoObj;

	if (!args[0])
		return sendMessageWTyping(
			from,
			{ text: `❌ Usage: *${prefix}tr <lang> <text>* or reply to a message\n\nExamples:\n• ${prefix}tr hi Hello world\n• ${prefix}tr es Good morning\n\nCommon codes: en hi es fr de ar zh ja ko pt ru` },
			{ quoted: msg }
		);

	const targetLang = args[0].toLowerCase();
	let text = args.slice(1).join(" ").trim();

	// Fall back to quoted message if no text given
	if (!text) {
		text = extendedMessageOriginal?.quotedMessage?.conversation || extendedMessageOriginal?.quotedMessage?.extendedTextMessage?.text || "";
	}

	if (!text)
		return sendMessageWTyping(from, { text: `❌ Provide text or reply to a message to translate.` }, { quoted: msg });

	try {
		const res = await axios.get("https://translate.googleapis.com/translate_a/single", {
			params: {
				client: "gtx",
				sl: "auto",
				tl: targetLang,
				dt: "t",
				q: text,
			},
			timeout: 8000,
		});

		const translated = res.data[0].map((s) => s[0]).join("");
		const detectedLang = res.data[2];
		const fromName = LANG_NAMES[detectedLang] || detectedLang?.toUpperCase() || "Auto";
		const toName = LANG_NAMES[targetLang] || targetLang.toUpperCase();

		sendMessageWTyping(
			from,
			{ text: `🌐 *Translation*\n${fromName} → ${toName}\n\n${translated}` },
			{ quoted: msg }
		);
	} catch (err) {
		console.error("translate error:", err);
		sendMessageWTyping(from, { text: `❌ Translation failed. Check the language code and try again.` }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["tr", "translate"],
	desc: "Translate text to any language",
	usage: "tr <lang_code> <text> | reply to a message",
	handler,
});
