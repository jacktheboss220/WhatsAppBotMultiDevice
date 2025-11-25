import dotenv from "dotenv";
dotenv.config();
const myNumber = [
	process.env.MY_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.MY_NUMBER.split(",")[1] + "@lid",
];

import { fake_quoted } from "./getFakeQuoted.js";
import { getGroupData } from "../mongo-DB/groupDataDb.js";
import { extractPhoneNumber, formatJIDForDisplay } from "./lidUtils.js";

const getGroupEvent = async (sock, events, cache) => {
	let jid = events.id;
	let groupDataDB = await getGroupData(jid);
	cache.del(jid + ":groupMetadata");

	if (events.action == "add") {
		//Welcome Message
		if (groupDataDB.welcome != "") {
			// const wel_members = anu.participants.map((mem) => mem.split("@")[0]);
			events.participants.forEach((member) => {
				// Extract phone number from either LID or PN format
				const phoneNumber = extractPhoneNumber(member);
				sock.sendMessage(
					jid,
					{
						text: "Welcome @" + phoneNumber + "\n\n" + groupDataDB.welcome,
						mentions: [member],
					},
					{ quoted: fake_quoted(events, "Welcome to " + groupDataDB.grpName) }
				);
			});
		}
		//91Only Working
		if (groupDataDB.is91Only == true) {
			// Filter participants based on phone number (works for both LID and PN)
			let filteredParticipants = events.participants.filter((p) => {
				const phoneNumber = extractPhoneNumber(p);
				return !phoneNumber.startsWith("91");
			});
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
		sock.sendMessage(myNumber[0], {
			text: `*Action:* ${events.action}\n*Group:* ${jid}\n*Group Name:* ${groupDataDB?.grpName
				}\n*Participants:* ${events.participants.map((p) => extractPhoneNumber(p))}`,
		});
	} else {
		sock.sendMessage(myNumber[0], {
			text: `*Action:* ${events.action}\n*Group:* ${jid}\n*Group Name:* ${groupDataDB?.grpName
				}\n*Participants:* ${events.participants.map((p) => extractPhoneNumber(p))}`,
		});
	}
	console.log(events);
};

export default getGroupEvent;

