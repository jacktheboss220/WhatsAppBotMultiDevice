import { readFileEfficiently } from "../../functions/fileUtils.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	try {
		const imageBuffer = await readFileEfficiently("./assets/donate.png");
		await sendMessageWTyping(
			from,
			{
				image: imageBuffer,
				caption: "Donate to keep this bot alive!" + "\n\n" + "https://buymeacoffee.com/jacktheboss220",
			},
			{ quoted: msg }
		);
	} catch (err) {
		console.error("Failed to load donation image:", err.message);
		await sendMessageWTyping(
			from,
			{
				text: "Donate to keep this bot alive!\n\nhttps://buymeacoffee.com/jacktheboss220",
			},
			{ quoted: msg }
		);
	}
};

export default () => ({
	cmd: ["donate", "donation"],
	desc: "Donate to keep this bot alive",
	usage: "donate",
	handler,
});
