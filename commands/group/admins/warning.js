import { getGroupData, createGroupData, group } from "../../../db/groupData.js";
import { createMembersData, getMemberData, member } from "../../../db/members.js";
import { extractPhoneNumber } from "../../../utils/lid.js";
import { isPrivileged } from "../../../utils/roles.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { command, groupAdmins, sendMessageWTyping, botNumber, extendedMessageOriginal } = msgInfoObj;
	try {
		if (!extendedMessageOriginal) {
			return sendMessageWTyping(from, { text: "❌ Tag someone! or reply to a message" }, { quoted: msg });
		}

		let taggedJid = extendedMessageOriginal.participant || extendedMessageOriginal.mentionedJid?.[0];
		if (!taggedJid) {
			return sendMessageWTyping(from, { text: "❌ Tag someone! or reply to a message" }, { quoted: msg });
		}
		// JID is already in correct format (LID or PN)

		let isGroupAdmin = groupAdmins.includes(taggedJid);
		if (command != "unwarn") {
			if (taggedJid == botNumber[0] || taggedJid == botNumber[1])
				return sendMessageWTyping(from, { text: `_How can I warn Myself_` }, { quoted: msg });
			if (await isPrivileged(sock, taggedJid))
				return sendMessageWTyping(from, { text: `_Owner or Moderator cannot be warned_` }, { quoted: msg });
		}
		const groupData = await getGroupData(from);
		const memberData = await getMemberData(taggedJid);
		let warnCount = 0;
		if (groupData) {
			try {
				if (groupData.memberWarnCount == undefined || groupData.memberWarnCount.length == undefined) {
					group.updateOne(
						{ _id: from },
						{
							$set: { memberWarnCount: [] },
						}
					);
				} else {
					await groupData.memberWarnCount.forEach((element, index) => {
						if (element.member == taggedJid) {
							warnCount = element.count;
							return;
						}
					});
				}
			} catch (err) {
				return sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			}
		}
		if (memberData) {
			try {
				if (memberData.warning == undefined || memberData.warning.length == undefined) {
					await member.updateOne(
						{ _id: taggedJid },
						{
							$set: { warning: [] },
						}
					);
				}
			} catch (err) {
				return sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
			}
		}
		// Use extractPhoneNumber for LID/PN compatibility
		const phoneNumber = extractPhoneNumber(taggedJid);
		let warnMsg;
		switch (command) {
			case "warn":
				try {
					warnCount++;
					const bars = "🔴".repeat(warnCount) + "⚪".repeat(Math.max(0, 3 - warnCount));
					warnMsg = `⚠️ *Warning Issued*\n\n@${phoneNumber}\n${bars} *(${warnCount}/3)*\n\n${warnCount >= 3 ? "_⛔ Warning limit reached — you are being removed._" : "_Clean up your act or face removal._"}`;
					sendMessageWTyping(from, {
						text: warnMsg,
						mentions: [taggedJid],
					}, { quoted: msg });
					group
						.updateOne(
							{ _id: from, "memberWarnCount.member": taggedJid },
							{ $inc: { "memberWarnCount.$.count": 1 } }
						)
						.then((r) => {
							if (r.matchedCount == 0)
								group.updateOne(
									{ _id: from },
									{ $push: { memberWarnCount: { member: taggedJid, count: warnCount } } }
								);
						});
					member
						.updateOne({ _id: taggedJid, "warning.group": from }, { $inc: { "warning.$.count": 1 } })
						.then(async (r) => {
							if (r.matchedCount == 0)
								member.updateOne(
									{ _id: taggedJid },
									{ $push: { warning: { group: from, count: warnCount } } }
								);
							if (warnCount >= 3) {
								if (!groupAdmins.includes(botNumber[0]) && !groupAdmins.includes(botNumber[1])) {
									sendMessageWTyping(from, { text: "❌ I'm not Admin here!" }, { quoted: msg });
									return;
								}
								if (isGroupAdmin) {
									sendMessageWTyping(from, { text: "❌ Cannot remove admin!" }, { quoted: msg });
									return;
								}
								try {
									await sock.groupParticipantsUpdate(from, [taggedJid], "remove");
								} catch (removeErr) {
									// used to announce "Removed" even when WhatsApp refused
									sendMessageWTyping(from, { text: `❌ Could not remove: ${removeErr.message}` }, { quoted: msg });
									return;
								}
								// start clean if they are ever added back (the count used to keep growing past 3)
								await member.updateOne({ _id: taggedJid }, { $pull: { warning: { group: from } } });
								await group.updateOne({ _id: from }, { $pull: { memberWarnCount: { member: taggedJid } } });
								sendMessageWTyping(
									from,
									{ text: `✅ *Removed* @${phoneNumber} — reached 3 warnings.`, mentions: [taggedJid] },
									{ quoted: msg }
								);
							}
						})
						.catch((err) => {
							console.log(err);
						});
				} catch (err) {
					sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
				}
				break;
			case "unwarn":
				member
					.updateOne({ _id: taggedJid, "warning.group": from }, { $pull: { warning: { group: from } } })
					.then(() => {
						sendMessageWTyping(from, { text: `✅ Warnings cleared for @${phoneNumber}.`, mentions: [taggedJid] }, { quoted: msg });
					});
				group.updateOne(
					{ _id: from, "memberWarnCount.member": taggedJid },
					{ $pull: { memberWarnCount: { member: taggedJid } } }
				);
				break;
		}
	} catch (err) {
		sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["warn", "unwarn"],
	desc: "Warn a member, or take a warning back. Tag them or reply.",
	usage: "warn @mention | unwarn @mention | reply",
	handler,
});
