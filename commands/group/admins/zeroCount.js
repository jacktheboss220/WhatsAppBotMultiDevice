import { group } from "../../../mongo-DB/groupDataDb.js";
import { extractPhoneNumber } from "../../../functions/lidUtils.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const typeFieldMap = {
	text: "texttotal",
	image: "imagetotal",
	video: "videototal",
	sticker: "stickertotal",
	pdf: "pdftotal",
	doc: "pdftotal",
};

const typeLabels = {
	texttotal: "Text",
	imagetotal: "Image",
	videototal: "Video",
	stickertotal: "Sticker",
	pdftotal: "PDF/Doc",
	count: "Total",
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, groupMetadata } = msgInfoObj;
	const allParticipants = groupMetadata.participants.filter((p) => p.admin == null).map((p) => p.id);

	// Parse args: zero | zero 5 | zero text | zero text 5
	let filterField = "count";
	let threshold = 0;

	if (args?.length >= 1) {
		if (typeFieldMap[args[0].toLowerCase()]) {
			filterField = typeFieldMap[args[0].toLowerCase()];
			threshold = args[1] ? parseInt(args[1]) || 0 : 0;
		} else {
			threshold = parseInt(args[0]) || 0;
		}
	}

	group.findOne({ _id: from }).then((res) => {
		group
			.aggregate([
				{ $match: { _id: from } },
				{ $unwind: "$members" },
				{ $sort: { "members.count": -1 } },
				{ $group: { _id: "$_id", items: { $push: "$members" } } },
			])
			.toArray()
			.then((r) => {
				const items = r[0]?.items || [];
				let filtered = allParticipants
					.map((p) => {
						let found = items.find((m) => m.id == p);
						return found ?? { id: p, count: 0, texttotal: 0, imagetotal: 0, videototal: 0, stickertotal: 0, pdftotal: 0 };
					})
					.filter((p) => (p[filterField] || 0) <= threshold);

				const label = typeLabels[filterField];
				let mess =
					"____________________________\n\n" +
					"*Group Name:* " + res.grpName + "\n" +
					"*Filter:* " + label + " <= " + threshold + "\n" +
					"*Total Members:* " + filtered.length + "\n" +
					"____________________________\n\n" +
					readMore + "\n";

				filtered.forEach((element) => {
					mess += extractPhoneNumber(element.id) + ",\n";
				});
				sendMessageWTyping(from, { text: mess }, { quoted: msg });
			});
	});
};

export default () => ({
	cmd: ["zero"],
	desc: "Get members with zero/low message count (by type)",
	usage: "zero | zero <number> | zero <text|image|video|sticker|pdf> | zero <type> <number>",
	handler,
});
