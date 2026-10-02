import mdClient from "./client.js";

const group = mdClient.db("MyBotDataDB").collection("Groups");

const createGroupData = async (groupJid, groupMetadata) => {
	try {
		const res = await group.findOne({ _id: groupJid });
		if (res == null) {
			await group.insertOne({
				_id: groupJid,
				isBotOn: false,
				isImgOn: false,
				isChatBotOn: false,
				is91Only: false,
				isRankNotifOn: false,
				grpName: groupMetadata.subject,
				desc: groupMetadata.desc ? groupMetadata.desc.toString() : "",
				cmdBlocked: [],
				welcome: "",
				totalMsgCount: 0,
				memberWarnCount: [],
				members: [],
				chatHistory: [],
			});
		} else {
			await group.updateOne(
				{ _id: groupJid },
				{
					$set: {
						grpName: groupMetadata.subject,
						desc: groupMetadata.desc ? groupMetadata.desc.toString() : "",
					},
				}
			);
		}
	} catch (err) {
		console.error("[groupDataDb error]", err.message);
	}
};

const getGroupData = async (groupJid) => {
	try {
		const res = await group.findOne({ _id: groupJid });
		return res;
	} catch (err) {
		console.error("[groupDataDb error]", err.message);
		return null;
	}
};

// Baileys 7 addressing-mode migration: rename/merge a group's per-member entries
// (members[] and memberWarnCount[]) from the old PN id to the new LID id.
const migrateGroupMemberPNToLID = async (groupJid, lidJid, pnJid) => {
	if (!groupJid || !lidJid || !pnJid || lidJid === pnJid) return;
	try {
		const doc = await group.findOne({ _id: groupJid }, { projection: { members: 1, memberWarnCount: 1 } });
		if (!doc) return;

		const pnMember = doc.members?.find((m) => m.id === pnJid);
		if (pnMember) {
			const lidMember = doc.members?.find((m) => m.id === lidJid);
			if (lidMember) {
				await group.updateOne(
					{ _id: groupJid, "members.id": lidJid },
					{
						$inc: {
							"members.$.count": pnMember.count || 0,
							"members.$.texttotal": pnMember.texttotal || 0,
							"members.$.imagetotal": pnMember.imagetotal || 0,
							"members.$.videototal": pnMember.videototal || 0,
							"members.$.stickertotal": pnMember.stickertotal || 0,
							"members.$.pdftotal": pnMember.pdftotal || 0,
						},
					}
				);
				await group.updateOne({ _id: groupJid }, { $pull: { members: { id: pnJid } } });
			} else {
				await group.updateOne({ _id: groupJid, "members.id": pnJid }, { $set: { "members.$.id": lidJid } });
			}
		}

		const pnWarn = doc.memberWarnCount?.find((w) => w.member === pnJid);
		if (pnWarn) {
			const lidWarn = doc.memberWarnCount?.find((w) => w.member === lidJid);
			if (lidWarn) {
				await group.updateOne(
					{ _id: groupJid, "memberWarnCount.member": lidJid },
					{ $inc: { "memberWarnCount.$.count": pnWarn.count || 0 } }
				);
				await group.updateOne({ _id: groupJid }, { $pull: { memberWarnCount: { member: pnJid } } });
			} else {
				await group.updateOne(
					{ _id: groupJid, "memberWarnCount.member": pnJid },
					{ $set: { "memberWarnCount.$.member": lidJid } }
				);
			}
		}

		if (pnMember || pnWarn) {
			console.log(`[migrateGroupMemberPNToLID] Migrated ${pnJid} -> ${lidJid} in ${groupJid}`);
		}
	} catch (err) {
		console.error("[migrateGroupMemberPNToLID error]", err.message);
	}
};

export { getGroupData, createGroupData, group, migrateGroupMemberPNToLID };
