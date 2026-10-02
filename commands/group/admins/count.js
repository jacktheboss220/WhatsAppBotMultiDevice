import { group } from "../../../db/groupData.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
	const res = await group.findOne({ _id: from });
	if (!res) return sendMessageWTyping(from, { text: "❌ No data found in DB for this group." }, { quoted: msg });

	const items = [...(res.members || [])].sort((a, b) => (b.count || 0) - (a.count || 0));
	const totalText = items.reduce((s, m) => s + (m.texttotal || 0), 0);
	const totalImage = items.reduce((s, m) => s + (m.imagetotal || 0), 0);
	const totalVideo = items.reduce((s, m) => s + (m.videototal || 0), 0);
	const totalSticker = items.reduce((s, m) => s + (m.stickertotal || 0), 0);
	const totalPdf = items.reduce((s, m) => s + (m.pdftotal || 0), 0);

	let mess =
		"*Group:* " + res.grpName + "\n" +
		"*Total Members:* " + items.length + "\n\n" +
		"💬 Text: " + totalText + "\n" +
		"🖼️ Image: " + totalImage + "\n" +
		"🎥 Video: " + totalVideo + "\n" +
		"🎭 Sticker: " + totalSticker + "\n" +
		"📄 PDF/Doc: " + totalPdf + "\n" +
		"\n" + readMore + "\n\n";

	const showAll = args?.[0]?.toLowerCase() === "all";
	items.forEach((element) => {
		if (showAll) {
			mess +=
				`*${element.name}*\n` +
				`  💬 Text: ${element.texttotal || 0}  🖼️ Image: ${element.imagetotal || 0}  🎥 Video: ${element.videototal || 0}  🎭 Sticker: ${element.stickertotal || 0}  📄 PDF: ${element.pdftotal || 0}\n\n`;
		} else {
			mess += `${element.count || 0} - *${element.name}*\n`;
		}
	});
	sendMessageWTyping(from, { text: mess }, { quoted: msg });
};

export default () => ({
	cmd: ["count"],
	desc: "Show how many messages each member has sent.",
	usage: "count",
	handler,
});
