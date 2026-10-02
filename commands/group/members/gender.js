import axios from "axios";

const getGender = async (name) => {
	let url = "https://api.genderize.io/?name=" + name;
	let { data } = await axios.get(url, { timeout: 8000 });
	if (!data.gender) return Promise.reject("Name Not Found!!!");
	const genderEmoji = data.gender === "male" ? "👦" : "👧";
	let genderText = `${genderEmoji} *${data.name}* is likely *${data.gender}*\n📊 Probability: *${Math.round(data.probability * 100)}%*`;
	return new Promise((resolve, reject) => {
		if (genderText != "") resolve(genderText);
		else reject("Name Not Found!!!");
	});
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { prefix, sendMessageWTyping } = msgInfoObj;

	if (args.length == 0)
		return sendMessageWTyping(
			from,
			{ text: `❌ Name is not given! \nSend ${prefix}gender first_name` },
			{ quoted: msg }
		);

	if (args[0].includes("@"))
		return sendMessageWTyping(from, { text: `❌ Don't tag! \nSend ${prefix}gender first_name` }, { quoted: msg });

	getGender(args[0])
		.then((message) => {
			sendMessageWTyping(from, { text: message }, { quoted: msg });
		})
		.catch((error) => {
			sendMessageWTyping(from, { text: error.toString() }, { quoted: msg });
			console.log(error);
		});
};

export default () => ({
	cmd: ["gender"],
	desc: "Guess the gender of a name, or of the replied message's sender.",
	usage: "gender <name> | reply to a message.",
	handler,
});
