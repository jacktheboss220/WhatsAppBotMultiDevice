import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	const proURl = "https://programming-quotesapi.vercel.app/api/random";
	await axios(proURl, { timeout: 8000 })
		.then((res) => {
			let mess = `💻 *Programming Quote*\n\n_"${res.data.quote}"_\n\n— *${res.data.author}*`;
			sendMessageWTyping(from, { text: mess }, { quoted: msg });
		})
		.catch((err) => {
			sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			console.log(err);
		});
};

export default () => ({
	cmd: ["proquote", "pqoute"],
	desc: "Get a random programming quote.",
	usage: "proquote",
	handler,
});
