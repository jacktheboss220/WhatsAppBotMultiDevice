import mdClient from "../mongodb.js";
import { isLID, extractPhoneNumber } from "../functions/lidUtils.js";

mdClient.connect();

const member = mdClient.db("MyBotDataDB").collection("Members");

const createMembersData = async (jid, name) => {
	try {
		let idToUse = jid;
		let lid = null;
		let phoneNumber = null;

		if (isLID(jid)) {
			lid = jid;
			phoneNumber = extractPhoneNumber(jid);
			idToUse = phoneNumber + "@s.whatsapp.net"; // Normalize to PN JID
		} else {
			phoneNumber = extractPhoneNumber(jid);
		}

		// Try to find by _id (PN)
		let res = await member.findOne({ _id: idToUse });

		// If not found, and we have an LID, try to find by lid field
		if (res == null && lid) {
			res = await member.findOne({ lid: lid });
			if (res) idToUse = res._id;
		}

		if (res == null) {
			await member.insertOne({
				_id: idToUse,
				username: name,
				isBlock: false,
				totalmsg: 0,
				dmLimit: 1000,
				warning: [],
				phoneNumber: phoneNumber,
				...(lid ? { lid: lid } : {})
			});
		} else {
			await member.updateOne(
				{ _id: idToUse },
				{
					$set: {
						username: name,
						...(lid ? { lid: lid } : {}),
						...(phoneNumber ? { phoneNumber: phoneNumber } : {})
					},
				}
			);
		}
	} catch (err) {
		console.log(err);
	}
};

const getMemberData = async (jid) => {
	try {
		// 1. Try direct lookup by _id
		let res = await member.findOne({ _id: jid });
		if (res) return res;

		// 2. If it's an LID, try lookup by 'lid' field
		if (isLID(jid)) {
			res = await member.findOne({ lid: jid });
			if (res) return res;

			// 3. If still not found, try converting to PN and looking up by _id
			const pnJid = extractPhoneNumber(jid) + "@s.whatsapp.net";
			res = await member.findOne({ _id: pnJid });
			if (res) return res;
		}
		// 4. If it's a PN, try lookup by 'phoneNumber' field
		else {
			const pn = extractPhoneNumber(jid);
			res = await member.findOne({ phoneNumber: pn });
			if (res) return res;
		}

		return res;
	} catch (err) {
		console.log(err);
		return -1;
	}
};

export { createMembersData, getMemberData, member };

