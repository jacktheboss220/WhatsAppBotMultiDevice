import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	const proURl = "https://programming-quotesapi.vercel.app/api/random";
	await axios(proURl)
		.then((res) => {
			let mess = `: *Programmin Quote* :\n\n${res.data.quote}\n~By ${res.data.author}`;
			sendMessageWTyping(from, { text: mess }, { quoted: msg });
		})
		.catch((err) => {
			sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			console.log(err);
		});
};

export default () => ({
	cmd: ["proquote", "pqoute"],
	desc: "Get random programming quote",
	usage: "proquote",
	handler,
});
