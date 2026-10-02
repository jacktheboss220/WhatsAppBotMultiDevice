import "dotenv/config"; // ESM hoists imports: load .env here so this module never sees it half-set
import { extractPhoneNumber, isLID, getPNFromLID } from "./lid.js";

// MODERATORS: comma-separated phone numbers, "+91 98…" style is normalised to digits.
export const moderatorNumbers = (process.env.MODERATORS?.split(",") ?? []).map((n) => n.replace(/\D/g, "")).filter(Boolean);

const [ownerPN, ownerLID] = (process.env.MY_NUMBER ?? "").split(",").map((n) => n.trim());
const ownerJids = [ownerPN && `${ownerPN}@s.whatsapp.net`, ownerLID && `${ownerLID}@lid`].filter(Boolean);

export const isOwnerJid = (jid) => !!jid && ownerJids.includes(jid);

// Moderators are configured by PHONE number, but in LID chats the sender arrives as a LID.
// Try the alternate JID WhatsApp sends along (participantAlt/remoteJidAlt), then the LID->PN mapping.
export const isModeratorJid = async (sock, jid, altJid) => {
	for (const j of [jid, altJid]) {
		if (j && !isLID(j) && moderatorNumbers.includes(extractPhoneNumber(j))) return true;
	}
	if (isLID(jid)) {
		try {
			const pn = await getPNFromLID(sock, jid);
			if (pn && moderatorNumbers.includes(extractPhoneNumber(pn))) return true;
		} catch {
			/* no mapping known */
		}
	}
	return false;
};

// Owner or moderator: used to protect them from warn / remove / block.
export const isPrivileged = async (sock, jid, altJid) =>
	isOwnerJid(jid) || isOwnerJid(altJid) || (await isModeratorJid(sock, jid, altJid));
