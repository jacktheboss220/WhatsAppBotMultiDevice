import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	if (!args[0] || args[0].includes("http"))
		return sendMessageWTyping(from, { text: `*Provide Username*` }, { quoted: msg });
	let prof = args[0];

	const headers = {
		"User-Agent": "iphone_ua",
		"x-ig-app-id": "936619743392459",
	};
	if (process.env.INSTAGRAM_COOKIE) headers.Cookie = process.env.INSTAGRAM_COOKIE;

	let config = {
		method: "get",
		maxBodyLength: Infinity,
		url: `https://i.instagram.com/api/v1/users/web_profile_info/?username=${prof}`,
		headers,
		timeout: 8000,
	};

	axios
		.request(config)
		.then((res) => {
			if (res.data.status === "ok") {
				sendMessageWTyping(
					from,
					{
						image: { url: res.data.data.user.profile_pic_url_hd },
						caption: `*Here is the Profile Picture of ${prof}*`,
					},
					{ quoted: msg }
				);
			} else {
				sendMessageWTyping(from, { text: `*No Data Found*` }, { quoted: msg });
			}
		})
		.catch(async (err) => {
			sendMessageWTyping(from, { text: "*Error fetching profile picture*" }, { quoted: msg });
		});
};

export default () => ({
	cmd: ["idp", "dp"],
	desc: "Get an Instagram profile picture from a username.",
	usage: "idp | dp <username>",
	handler,
});
