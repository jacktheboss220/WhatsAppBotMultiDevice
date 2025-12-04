import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	if (!args[0]) {
		return sendMessageWTyping(from, { text: `*Please enter a word to search.*` }, { quoted: msg });
	}

	const word = args[0];

	try {
		const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

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
	} catch (err) {
		console.error(err);

		// User-friendly error
		return sendMessageWTyping(
			from,
			{ text: `Couldn't find the word *${word}*. Try another one.` },
			{ quoted: msg }
		);
	}
};

export default () => ({
	cmd: ["dictionary", "dict"],
	desc: "Get meaning of a word",
	usage: "dict <word>",
	handler,
});
