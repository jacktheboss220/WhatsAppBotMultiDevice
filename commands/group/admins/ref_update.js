import { getReferralData, updateReferral } from "../../mongo-DB/referralsDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { senderJid, sendMessageWTyping, isGroupAdmin, isOwner, groupMetadata } = msgInfoObj;

	if (!isGroupAdmin && !isOwner) {
		await sendMessageWTyping(from, { text: "*❌ Admin access required.*" }, { quoted: msg });
		return;
	}

	if (args.length < 2) {
		await sendMessageWTyping(from, {
			text: "*📋 Usage:* `-ref_update <old_company_name> <new_company_name>`\n\n_Example:_ `-ref_update Google Alphabet`",
		}, { quoted: msg });
		return;
	}

	const [oldName, ...newNameParts] = args;
	const newCompanyName = newNameParts.join(" ");

	const result = await updateReferral(oldName, newCompanyName);

	if (!result.success) {
		if (result.reason === "not_found") {
			await sendMessageWTyping(from, {
				text: `*❌ Company not found:* ${oldName}`,
			}, { quoted: msg });
		} else {
			await sendMessageWTyping(from, {
				text: "*❌ Database error. Please try again.*",
			}, { quoted: msg });
		}
		return;
	}

	await sendMessageWTyping(from, {
		text: `*✅ Company Updated*\n\n*Old Name:* ${oldName}\n*New Name:* ${newCompanyName}`,
	}, { quoted: msg });
};

export default () => ({
	cmd: ["ref_update"],
	desc: "Update a company name (Admin only)",
	usage: "ref_update <old_company_name> <new_company_name>",
	handler,
});