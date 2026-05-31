import { getReferralData, deleteReferral } from "../../mongo-DB/referralsDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { senderJid, sendMessageWTyping, isGroupAdmin, isOwner, groupMetadata } = msgInfoObj;

	if (!isGroupAdmin && !isOwner) {
		await sendMessageWTyping(from, { text: "*❌ Admin access required.*" }, { quoted: msg });
		return;
	}

	if (args.length === 0) {
		await sendMessageWTyping(from, {
			text: "*📋 Usage:* `-ref_delete <company name>`\n\n_Example:_ `-ref_delete Google`",
		}, { quoted: msg });
		return;
	}

	const companyName = args.join(" ");
	const result = await deleteReferral(companyName);

	if (!result.success) {
		if (result.reason === "not_found") {
			await sendMessageWTyping(from, {
				text: `*❌ Company not found:* ${companyName}`,
			}, { quoted: msg });
		} else {
			await sendMessageWTyping(from, {
				text: "*❌ Database error. Please try again.*",
			}, { quoted: msg });
		}
		return;
	}

	await sendMessageWTyping(from, {
		text: `*✅ Company Deleted*\n\n*Company:* ${companyName}`,
	}, { quoted: msg });
};

export default () => ({
	cmd: ["ref_delete"],
	desc: "Delete a company (Admin only)",
	usage: "ref_delete <company_name>",
	handler,
});