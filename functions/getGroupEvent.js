require("dotenv").config();
const myNumber = process.env.MY_NUMBER + "@s.whatsapp.net";
const { fake_quoted } = require("./getFakeQuoted");
const { getGroupData } = require("../mongo-DB/groupDataDb");

const getGroupEvent = async (sock, events, cache) => {
	let jid = events.id;
	let groupDataDB = await getGroupData(jid);
	cache.del(jid + ":groupMetadata");

	if (events.action == "add") {
		//Welcome Message
		if (groupDataDB.welcome != "") {
			// const wel_members = anu.participants.map((mem) => mem.split("@")[0]);
			events.participants.forEach((member) => {
				sock.sendMessage(
					jid,
					{
						text: "Welcome @" + member.split("@")[0] + "\n\n" + groupDataDB.welcome,
						mentions: [member],
					},
					{ quoted: fake_quoted(events, "Welcome to " + groupDataDB.grpName) }
				);
			});
		}
		//91Only Working
		if (groupDataDB.is91Only == true) {
			let filteredParticipants = events.participants.filter((p) => !p.startsWith("91"));
			if (filteredParticipants.length > 0) {
				sock.groupParticipantsUpdate(jid, filteredParticipants, "remove");
				sock.sendMessage(
					jid,
					{
						text: "```Only Indian Number Allowed In This Group.\n```",
					},
					{ quoted: fake_quoted(events, "Only Indian Number Allowed, Namaste") }
				);
			}
		}
		sock.sendMessage(myNumber, {
			text: `*Action:* ${events.action}\n*Group:* ${jid}\n*Group Name:* ${
				groupDataDB?.grpName
			}\n*Participants:* ${events.participants.map((p) => p.split("@")[0])}`,
		});
	} else {
		sock.sendMessage(myNumber, {
			text: `*Action:* ${events.action}\n*Group:* ${jid}\n*Group Name:* ${
				groupDataDB?.grpName
			}\n*Participants:* ${events.participants.map((p) => p.split("@")[0])}`,
		});
	}
	console.log(events);
};

module.exports = getGroupEvent;
