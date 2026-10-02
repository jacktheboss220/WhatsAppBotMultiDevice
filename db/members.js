import mdClient from "./client.js";
import { extractPhoneNumber } from "../utils/lid.js";

const member = mdClient.db("MyBotDataDB").collection("Members");

const createMembersData = async (jid, name) => {
	try {
		let res = await member.findOne({ _id: jid });

		if (res == null) {
			await member.insertOne({
				_id: jid,
				username: name,
				isBlock: false,
				totalmsg: 0,
				texttotal: 0,
				imagetotal: 0,
				videototal: 0,
				stickertotal: 0,
				pdftotal: 0,
				dmLimit: 99999,
				warning: [],
			});
		} else {
			await member.updateOne(
				{ _id: jid },
				{
					$set: {
						username: name,
					},
				}
			);
		}
	} catch (err) {
		console.error("[membersDataDb error]", err.message);
	}
};

const getMemberData = async (jid) => {
	try {
		return await member.findOne({ _id: jid });
	} catch (err) {
		console.error("[membersDataDb error]", err.message);
		return null;
	}
};

// Baileys 7 addressing-mode migration: an old doc keyed by "<pn>@s.whatsapp.net"
// needs to move to "<lid>@lid" once we learn the mapping from a message's
// participantAlt/remoteJidAlt. Runs a cheap no-op findOne once the old doc is gone.
const migratePNToLID = async (lidJid, pnJid) => {
	if (!lidJid || !pnJid || lidJid === pnJid) return;
	try {
		const oldDoc = await member.findOne({ _id: pnJid });
		if (!oldDoc) return;

		const newDoc = await member.findOne({ _id: lidJid });
		if (!newDoc) {
			const { _id, ...data } = oldDoc;
			await member.insertOne({ ...data, _id: lidJid, phoneNumber: extractPhoneNumber(pnJid) });
		} else {
			await member.updateOne(
				{ _id: lidJid },
				{
					$inc: {
						totalmsg: oldDoc.totalmsg || 0,
						texttotal: oldDoc.texttotal || 0,
						imagetotal: oldDoc.imagetotal || 0,
						videototal: oldDoc.videototal || 0,
						stickertotal: oldDoc.stickertotal || 0,
						pdftotal: oldDoc.pdftotal || 0,
					},
					$addToSet: { warning: { $each: oldDoc.warning || [] } },
					$set: {
						phoneNumber: extractPhoneNumber(pnJid),
						// keep a block and a known name from the old PN doc
						...(oldDoc.isBlock && { isBlock: true }),
						...(!newDoc.username && oldDoc.username && { username: oldDoc.username }),
					},
				}
			);
		}
		await member.deleteOne({ _id: pnJid });
		console.log(`[migratePNToLID] Migrated ${pnJid} -> ${lidJid}`);
	} catch (err) {
		console.error("[migratePNToLID error]", err.message);
	}
};

export { createMembersData, getMemberData, member, migratePNToLID };
