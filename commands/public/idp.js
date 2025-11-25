import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	if (!args[0] || args[0].includes("http"))
		return sendMessageWTyping(from, { text: `*Provide Username*` }, { quoted: msg });
	let prof = args[0];

	let config = {
		method: "get",
		maxBodyLength: Infinity,
		url: `https://i.instagram.com/api/v1/users/web_profile_info/?username=${prof}`,
		headers: {
			"User-Agent": "iphone_ua",
			"x-ig-app-id": "936619743392459",
			Cookie: "csrftoken=dOj8Cg7x7dcopcYjfdyb2CXn5Q5q8Nae; ig_did=23EC9D92-710B-4E35-81C6-302661C68C7A; ig_nrcb=1; mid=aSVNkwAAAAHSQh6TfnudZMPSYyKd",
		},
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
	desc: "Get Instagram Profile Picture",
	usage: "idp | dp <username>",
	handler,
});
