/**
 * Check if a JID is in LID format
 * @param {string} jid - The JID to check
 * @returns {boolean} True if the JID is in LID format
 */
export function isLID(jid) {
	return jid && jid.includes("@lid");
}

/**
 * Check if a JID is in Phone Number (PN) format
 * @param {string} jid - The JID to check
 * @returns {boolean} True if the JID is in PN format
 */
export function isPN(jid) {
	return jid && jid.includes("@s.whatsapp.net");
}

/**
 * Check if a JID is a group JID
 * @param {string} jid - The JID to check
 * @returns {boolean} True if the JID is a group
 */
export function isGroup(jid) {
	return jid && jid.includes("@g.us");
}

/**
 * Get LID from Phone Number using the socket's LID mapping repository
 * @param {object} sock - The WhatsApp socket instance
 * @param {string} phoneNumber - Phone number (with or without @s.whatsapp.net)
 * @returns {Promise<string>} The LID if found, otherwise returns PN format
 */
export async function getLIDFromPN(sock, phoneNumber) {
	try {
		// Remove @s.whatsapp.net if present
		const cleanNumber = phoneNumber.replace("@s.whatsapp.net", "");

		// Try to get LID from the mapping repository
		if (sock?.signalRepository?.lidMapping) {
			const lid = await sock.signalRepository.lidMapping.getLIDForPN(cleanNumber);
			if (lid) return lid;
		}

		// Fallback to PN format
		return cleanNumber + "@s.whatsapp.net";
	} catch (error) {
		console.error("Error getting LID from PN:", error);
		const cleanNumber = phoneNumber.replace("@s.whatsapp.net", "");
		return cleanNumber + "@s.whatsapp.net";
	}
}

/**
 * Get multiple LIDs from Phone Numbers
 * @param {object} sock - The WhatsApp socket instance
 * @param {string[]} phoneNumbers - Array of phone numbers
 * @returns {Promise<string[]>} Array of LIDs or PNs
 */
export async function getLIDsFromPNs(sock, phoneNumbers) {
	try {
		if (sock?.signalRepository?.lidMapping) {
			const cleanNumbers = phoneNumbers.map((pn) => pn.replace("@s.whatsapp.net", ""));
			const lids = await sock.signalRepository.lidMapping.getLIDsForPNs(cleanNumbers);
			return lids || phoneNumbers.map((pn) => (pn.includes("@") ? pn : pn + "@s.whatsapp.net"));
		}
		return phoneNumbers.map((pn) => (pn.includes("@") ? pn : pn + "@s.whatsapp.net"));
	} catch (error) {
		console.error("Error getting LIDs from PNs:", error);
		return phoneNumbers.map((pn) => (pn.includes("@") ? pn : pn + "@s.whatsapp.net"));
	}
}

/**
 * Get Phone Number from LID using the socket's LID mapping repository
 * @param {object} sock - The WhatsApp socket instance
 * @param {string} lid - The LID to convert
 * @returns {string|null} The phone number in PN format, or null if not found
 */
export function getPNFromLID(sock, lid) {
	try {
		if (sock?.signalRepository?.lidMapping) {
			return sock.signalRepository.lidMapping.getPNForLID(lid);
		}
		return null;
	} catch (error) {
		console.error("Error getting PN from LID:", error);
		return null;
	}
}

/**
 * Extract phone number from any JID format (LID or PN)
 * @param {string} jid - The JID to extract from
 * @returns {string} The phone number without domain
 */
export function extractPhoneNumber(jid) {
	if (typeof jid !== "string") return jid;
	if (!jid) return "";

	// Handle colon format (some special cases)
	if (jid?.includes(":")) {
		return jid.split(":")[0];
	}

	// Extract the part before @
	return jid.split("@")[0];
}

/**
 * Normalize a JID or phone number to the preferred WhatsApp format
 * Tries to get LID first, falls back to PN format
 * @param {object} sock - The WhatsApp socket instance
 * @param {string} identifier - Phone number or JID
 * @returns {Promise<string>} Normalized JID
 */
export async function normalizeJID(sock, identifier) {
	if (!identifier) return "";

	// If already a JID (contains @), return as-is
	if (identifier.includes("@")) {
		return identifier;
	}

	// Try to get LID (preferred format)
	try {
		if (sock?.signalRepository?.lidMapping) {
			const lid = await sock.signalRepository.lidMapping.getLIDForPN(identifier);
			if (lid) return lid;
		}
	} catch (error) {
		console.error("Error normalizing JID:", error);
	}

	// Fallback to PN format
	return identifier + "@s.whatsapp.net";
}

/**
 * Store LID/PN mapping in the socket's repository
 * @param {object} sock - The WhatsApp socket instance
 * @param {string} lid - The LID
 * @param {string} pn - The phone number
 */
export function storeLIDPNMapping(sock, lid, pn) {
	try {
		if (sock?.signalRepository?.lidMapping) {
			sock.signalRepository.lidMapping.storeLIDPNMapping(lid, pn);
		}
	} catch (error) {
		console.error("Error storing LID/PN mapping:", error);
	}
}

/**
 * Store multiple LID/PN mappings
 * @param {object} sock - The WhatsApp socket instance
 * @param {object} mappings - Object with LID as key and PN as value
 */
export function storeLIDPNMappings(sock, mappings) {
	try {
		if (sock?.signalRepository?.lidMapping) {
			sock.signalRepository.lidMapping.storeLIDPNMappings(mappings);
		}
	} catch (error) {
		console.error("Error storing LID/PN mappings:", error);
	}
}

/**
 * Get the preferred JID format for a user (LID if available, otherwise PN)
 * @param {object} sock - The WhatsApp socket instance
 * @param {string} jid - Any JID format
 * @returns {Promise<string>} The preferred JID format
 */
export async function getPreferredJID(sock, jid) {
	if (!jid) return "";

	// If it's already a LID, return it
	if (isLID(jid)) return jid;

	// If it's a PN, try to get the LID
	if (isPN(jid)) {
		const phoneNumber = extractPhoneNumber(jid);
		return await getLIDFromPN(sock, phoneNumber);
	}

	// If it's just a phone number, normalize it
	return await normalizeJID(sock, jid);
}

/**
 * Format a JID for display (extract phone number)
 * @param {string} jid - The JID to format
 * @returns {string} Formatted phone number for display
 */
export function formatJIDForDisplay(jid) {
	return extractPhoneNumber(jid);
}

/**
 * Check if two JIDs refer to the same user (handles LID/PN equivalence)
 * @param {object} sock - The WhatsApp socket instance
 * @param {string} jid1 - First JID
 * @param {string} jid2 - Second JID
 * @returns {Promise<boolean>} True if they refer to the same user
 */
export async function isSameUser(sock, jid1, jid2) {
	if (jid1 === jid2) return true;

	try {
		// Get both in LID format for comparison
		const lid1 = isLID(jid1) ? jid1 : await getLIDFromPN(sock, extractPhoneNumber(jid1));
		const lid2 = isLID(jid2) ? jid2 : await getLIDFromPN(sock, extractPhoneNumber(jid2));

		return lid1 === lid2;
	} catch (error) {
		console.error("Error comparing JIDs:", error);
		return false;
	}
}

export default {
	isLID,
	isPN,
	isGroup,
	getLIDFromPN,
	getLIDsFromPNs,
	getPNFromLID,
	extractPhoneNumber,
	normalizeJID,
	storeLIDPNMapping,
	storeLIDPNMappings,
	getPreferredJID,
	formatJIDForDisplay,
	isSameUser,
};
