import { group } from "../../../mongo-DB/groupDataDb.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;
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
				let mess =
					"*Group:* " +
					res.grpName +
					res.totalMsgCount +
					"*Total Members:*" +
					r[0].items.length +
					"\n\n" +
					readMore +
					"\n";
				r[0].items.forEach((element) => {
					mess += element.count + " - *" + element.name + "*\n";
				});
				sendMessageWTyping(from, { text: mess }, { quoted: msg });
			});
	});
};

export default () => ({
	cmd: ["count"],
	desc: "Get message count of members",
	usage: "count",
	handler,
});
