import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	var new_order = "date";
	var new_page = args[0] ? args[0] : 1;
	var arg_free = 0;
	var arg_keyword = "";
	var arg_language = "";
	let mess = "";
	await axios(
		"https://www.real.discount/api/all-courses/?store=Udemy&page=" +
			new_page +
			"&per_page=10&orderby=" +
			new_order +
			"&free=" +
			arg_free +
			"&search=" +
			arg_keyword +
			"&language=" +
			arg_language,
		{ timeout: 8000 }
	)
		.then((res) => {
			mess = `🎓 *Free Udemy Courses*\n\n`;
			res.data.results.forEach((value, i) => {
				mess += `${i + 1}. *${value.name}*\n🔗 ${value.url}\n\n`;
			});
			sendMessageWTyping(from, { text: mess.trim() }, { quoted: msg });
		})
		.catch((err) => {
			sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			console.log(err);
		});
};

export default () => ({
	cmd: ["un"],
	desc: "Get free Udemy courses. Add a page number for more.",
	usage: "un | <page number>",
	handler,
});
