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
			sendMessageWTyping(
				from,
				{
					text: `${data[0].name}'s Message Count In Group is ${data[0].count}`,
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
