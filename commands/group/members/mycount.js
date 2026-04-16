import { group } from "../../../mongo-DB/groupDataDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, senderJid } = msgInfoObj;

	const filter = {
		_id: from,
		members: {
			$elemMatch: {
				id: senderJid,
			},
		},
	};

	group.findOne(filter).then((res) => {
		if (res) {
			let data = res.members.filter((element) => {
				return element.id === senderJid;
			});
			const d = data[0];
			sendMessageWTyping(
				from,
				{
					text: `*${d.name}'s Message Stats In This Group*\n\n` +
						`Total: ${d.count || 0}\n` +
						`💬 Text: ${d.texttotal || 0}\n` +
						`🖼️ Image: ${d.imagetotal || 0}\n` +
						`🎥 Video: ${d.videototal || 0}\n` +
						`🎭 Sticker: ${d.stickertotal || 0}\n` +
						`📄 PDF/Doc: ${d.pdftotal || 0}`,
				},
				{ quoted: msg }
			);
		} else {
			sendMessageWTyping(from, { text: "No Data Found" }, { quoted: msg });
		}
	});
};

export default () => ({
	cmd: ["mycount", "total"],
	desc: "Get your message count in group",
	usage: "total | mycount",
	handler,
});
