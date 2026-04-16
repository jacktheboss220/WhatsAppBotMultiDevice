import sendToTelegram, { escapeHtml } from "./telegramLogger.js";
import { fake_quoted } from "./getFakeQuoted.js";
import { getGroupData } from "../mongo-DB/groupDataDb.js";
import { extractPhoneNumber, formatJIDForDisplay } from "./lidUtils.js";

const getPhone = (p) =>
	typeof p === "string"
		? extractPhoneNumber(p)
		: extractPhoneNumber(p?.id || p?.jid || p?.phoneNumber || "");

const getGroupEvent = async (sock, events, cache) => {
	let jid = events.id;
	let groupDataDB = await getGroupData(jid);
	cache.del(jid + ":groupMetadata");

	if (events.action == "add") {
		if (groupDataDB.welcome != "") {
			events.participants.forEach((member) => {
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
			let filteredParticipants = events.participants.filter((p) => {
				const phoneNumber = extractPhoneNumber(p.phoneNumber);
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
		const addedNumbers = events.participants.map((p) => `<code>${escapeHtml(getPhone(p))}</code>`).join(", ");
		sendToTelegram(
			`➕ <b>Group Update</b>\n` +
			`━━━━━━━━━━━━━━\n` +
			`🏠 <b>Group:</b> ${escapeHtml(groupDataDB?.grpName)}\n` +
			`👤 <b>Joined:</b> ${addedNumbers}`
		);
	} else {
		const actionEmoji = events.action === "remove" ? "➖" : events.action === "promote" ? "⬆️" : events.action === "demote" ? "⬇️" : "🔄";
		const actionLabel = events.action === "remove" ? "Left / Removed" : events.action === "promote" ? "Promoted to Admin" : events.action === "demote" ? "Demoted from Admin" : escapeHtml(events.action);
		const numbers = events.participants.map((p) => `<code>${escapeHtml(getPhone(p))}</code>`).join(", ");
		sendToTelegram(
			`${actionEmoji} <b>Group Update</b>\n` +
			`━━━━━━━━━━━━━━\n` +
			`🏠 <b>Group:</b> ${escapeHtml(groupDataDB?.grpName)}\n` +
			`👤 <b>Member:</b> ${numbers}\n` +
			`📋 <b>Action:</b> ${actionLabel}`
		);
	}
	console.log(events);
};

export default getGroupEvent;
