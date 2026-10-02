import { escapeHtml } from "../notify/telegram.js";
import notifyOwner from "../notify/owner.js";
import { fake_quoted } from "../utils/fakeQuoted.js";
import { getGroupData } from "../db/groupData.js";
import { extractPhoneNumber, formatJIDForDisplay, isPN, isLID, getPNFromLID } from "../utils/lid.js";
import messageQueue from "../queue/messageQueue.js";
import { delGroupMeta } from "../cache/redisCache.js";
import groupMetaStore from "../cache/groupMetaStore.js";

const getPhone = (p) =>
	typeof p === "string"
		? extractPhoneNumber(p)
		: extractPhoneNumber(p?.id || p?.jid || p?.phoneNumber || "");

// Real phone number of a participant for the +91 check, or "" when it can't be resolved.
// Never derived from LID digits (a LID is not a phone number), so an unknown member is left alone
// instead of being removed as "non-Indian".
export const resolvePhone = async (sock, p) => {
	const jids = typeof p === "string" ? [p] : [p?.phoneNumber, p?.jid, p?.id, p?.lid];
	let pn = jids.find((j) => j && isPN(j));
	if (!pn) {
		const lid = jids.find((j) => j && isLID(j));
		if (lid) {
			try {
				pn = await getPNFromLID(sock, lid);
			} catch {
				pn = null;
			}
		}
	}
	return pn ? extractPhoneNumber(pn) : "";
};

const getGroupEvent = async (sock, events, cache) => {
	let jid = events.id;
	// Invalidate both layers (Redis + NodeCache) or stale admin lists survive a promote/demote
	cache.del(jid + ":groupMetadata");
	groupMetaStore.del(jid);
	await delGroupMeta(jid);
	let groupDataDB = await getGroupData(jid);
	// Group doc is only created on first text message (see core/messages.js) — a join
	// event can fire before that ever happens, so bail instead of crashing on null.
	if (!groupDataDB) return;

	if (events.action == "add") {
		if (groupDataDB.welcome != "") {
			for (const member of events.participants) {
				const phoneNumber = getPhone(member);
				await messageQueue.enqueue(jid, () => sock.sendMessage(
					jid,
					{
						text: "Welcome @" + phoneNumber + "\n\n" + groupDataDB.welcome,
						mentions: [member.id],
					},
					{ quoted: fake_quoted(events, "Welcome to " + groupDataDB.grpName) }
				), 1);
			}
		}
		//91Only Working
		if (groupDataDB.is91Only == true) {
			const filteredParticipants = [];
			for (const p of events.participants) {
				const phoneNumber = await resolvePhone(sock, p);
				if (!phoneNumber) {
					console.warn(`[is91Only] no phone number for ${p?.id ?? p} in ${jid}, not removing`);
					continue;
				}
				// groupParticipantsUpdate takes JID strings (was being passed the participant objects)
				if (!phoneNumber.startsWith("91")) filteredParticipants.push(typeof p === "string" ? p : p.id);
			}
			if (filteredParticipants.length > 0) {
				sock.groupParticipantsUpdate(jid, filteredParticipants, "remove").catch((e) =>
					console.error("[is91Only] remove failed:", e.message),
				);
				await messageQueue.enqueue(jid, () => sock.sendMessage(
					jid,
					{
						text: "```Only Indian Number Allowed In This Group.\n```",
					},
					{ quoted: fake_quoted(events, "Only Indian Number Allowed, Namaste") }
				), 1);
			}
		}
		const addedNumbers = events.participants.map((p) => `<code>${escapeHtml(getPhone(p))}</code>`).join(", ");
		notifyOwner(null,
			`➕ <b>Group Update</b>\n` +
			`━━━━━━━━━━━━━━\n` +
			`🏠 <b>Group:</b> ${escapeHtml(groupDataDB?.grpName)}\n` +
			`👤 <b>Joined:</b> ${addedNumbers}`
		);
	} else {
		const actionEmoji = events.action === "remove" ? "➖" : events.action === "promote" ? "⬆️" : events.action === "demote" ? "⬇️" : "🔄";
		const actionLabel = events.action === "remove" ? "Left / Removed" : events.action === "promote" ? "Promoted to Admin" : events.action === "demote" ? "Demoted from Admin" : escapeHtml(events.action);
		const numbers = events.participants.map((p) => `<code>${escapeHtml(getPhone(p))}</code>`).join(", ");
		notifyOwner(null,
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
