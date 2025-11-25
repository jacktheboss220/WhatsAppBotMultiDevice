import axiox from "axios";
import jsdom from "jsdom";
import { getMemberData, member } from "../../mongo-DB/membersDataDb.js";

const { JSDOM } = jsdom;

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { isGroup, senderJid, sendMessageWTyping } = msgInfoObj;
	const limit = await getMemberData(senderJid);

	if (!args[0] || !args[0].includes("reddit.com/r"))
		return sendMessageWTyping(from, { text: "Provide the post link after command." }, { quoted: msg });
	console.log(args[0]);
	if (!isGroup) {
		if (limit.dmLimit <= 0) {
			return sendMessageWTyping(
				from,
				{ text: "You have used your monthly limit.\nWait for next month." },
				{ quoted: msg }
			);
		}
		member.updateOne({ _id: senderJid }, { $inc: { dmLimit: -1 } });
	}
	await axiox("https://redditsave.com/info?url=" + args[0])
		.then((res) => {
			const dom = new JSDOM(res.data);
			const down = dom.window.document.getElementsByClassName("downloadbutton")[0].getAttribute("href");
			try {
				if (down.endsWith("png") || down.endsWith("jpg") || down.endsWith("jpeg")) {
					sendMessageWTyping(
						from,
						{
							image: { url: down },
						},
						{ quoted: msg }
					);
				} else if (down.endsWith("fallback")) {
					sendMessageWTyping(
						from,
						{
							video: { url: down },
						},
						{ quoted: msg }
					);
				} else {
					sendMessageWTyping(
						from,
						{
							text: `Can't download gif for now wait for the update`,
						},
						{ quoted: msg }
					);
				}
			} catch {
				sendMessageWTyping(from, { text: "No Post Found" }, { quoted: msg });
			}
		})
		.catch((err) => {
			sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			console.log(err);
		});
};

export default () => ({
	cmd: ["reddit"],
	desc: "Download post from reddit",
	usage: "reddit | post link",
	handler,
});
