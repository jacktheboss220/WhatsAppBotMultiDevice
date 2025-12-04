import snapsave from "snapsave-downloader";
import axios from "axios";
import { fileTypeFromBuffer } from "file-type";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { prefix, sendMessageWTyping, ig } = msgInfoObj;

	if (args.length === 0)
		return sendMessageWTyping(from, { text: `❎ URL is empty! \nSend ${prefix}insta url` }, { quoted: msg });
	let urlInstagram = args[0];

	if (
		!(
			urlInstagram.includes("instagram.com/") ||
			urlInstagram.includes("instagram.com/p/") ||
			urlInstagram.includes("instagram.com/reel/") ||
			urlInstagram.includes("instagram.com/tv/")
		)
	)
		return sendMessageWTyping(
			from,
			{ text: `❎ Wrong URL! Only Instagram posted videos, tv and reels can be downloaded.` },
			{ quoted: msg }
		);

	if (urlInstagram.includes("?")) urlInstagram = urlInstagram.split("/?")[0];
	console.log(urlInstagram);

	// ig.fetchPost(urlInsta).then(async (res) => {
	//     if (res.media_count == 1) {
	//         if (res.links[0].type == "video") {
	//             sock.sendMessage(from,
	//                 { video: { url: res.links[0].url } },
	//                 { quoted: msg }
	//             )
	//         } else if (res.links[0].type == "image") {
	//             sock.sendMessage(from,
	//                 { image: { url: res.links[0].url } },
	//                 { quoted: msg }
	//             )
	//         }
	//     } else if (res.media_count > 1) {
	//         for (let i = 0; i < res.media_count; i++) {
	//             await new Promise((resolve) => setTimeout(resolve, 500));
	//             if (res.links[i].type == "video") {
	//                 sock.sendMessage(from,
	//                     { video: { url: res.links[i].url } },
	//                     { quoted: msg }
	//                 )
	//             } else if (res.links[i].type == "image") {
	//                 sock.sendMessage(from,
	//                     { image: { url: res.links[i].url } },
	//                     { quoted: msg }
	//                 )
	//             }
	//         }
	//     }
	// }).catch(() => {
	snapsave(urlInstagram)
		.then(async (res) => {
			if (res.status) {
				const data = [...new Set(res.data.map((item) => item.url))];

				for (let i = 0; i < data.length; i++) {
					// await new Promise((resolve) => setTimeout(resolve, 500));
					const url = data[i];
					const detected = await detectUrlType(url);

					if (detected.detected === "video") {
						sock.sendMessage(from, { video: { url: url } }, { quoted: msg });
					} else if (detected.detected === "image") {
						sock.sendMessage(from, { image: { url: url } }, { quoted: msg });
					} else {
						sock.sendMessage(
							from,
							{ document: { url: url }, mimetype: detected.mime, fileName: `file.${detected.ext}` },
							{ quoted: msg }
						);
					}
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			} else {
				sendMessageWTyping(from, { text: "No Data Found!!" }, { quoted: msg });
			}
		})
		.catch((err) => {
			console.log(err);
			sendMessageWTyping(from, { text: "Error!! Maybe private account or invalid URL." }, { quoted: msg });
		});
	// });
};

async function detectUrlType(url) {
	try {
		const res = await axios.get(url, {
			responseType: "arraybuffer",
			headers: { Range: "bytes=0-16383" },
		});

		const buffer = Buffer.from(res.data);
		const type = await fileTypeFromBuffer(buffer);

		if (!type) {
			return { type: "unknown", reason: "no magic bytes detected" };
		}

		return {
			ext: type.ext,
			mime: type.mime,
			detected: type.mime.startsWith("image/") ? "image" : type.mime.startsWith("video/") ? "video" : "other",
		};
	} catch (err) {
		return { error: err.message };
	}
}

export default () => ({
	cmd: ["insta", "i"],
	desc: "Download Instagram post",
	usage: "insta | i <url>",
	handler,
});
