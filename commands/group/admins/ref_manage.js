import { deleteReferral, updateReferral } from "../../../mongo-DB/referralsDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { command, sendMessageWTyping, isGroupAdmin, isOwner } = msgInfoObj;

	if (!isGroupAdmin && !isOwner) {
		await sendMessageWTyping(from, { text: "*❌ Admin access required.*" }, { quoted: msg });
		return;
	}

	if (command === "ref_delete") {
		if (args.length === 0) {
			await sendMessageWTyping(
				from,
				{ text: "*📋 Usage:* `-ref_delete <company name>`\n\n_Example:_ `-ref_delete Google`" },
				{ quoted: msg },
			);
			return;
		}
		const companyName = args.join(" ");
		const result = await deleteReferral(companyName);
		if (!result.success) {
			const text =
				result.reason === "not_found"
					? `*❌ Company not found:* ${companyName}`
					: "*❌ Database error. Please try again.*";
			await sendMessageWTyping(from, { text }, { quoted: msg });
			return;
		}
		await sendMessageWTyping(
			from,
			{ text: `*✅ Company Deleted*\n\n*Company:* ${companyName}` },
			{ quoted: msg },
		);
	} else if (command === "ref_update") {
		if (args.length < 2) {
			await sendMessageWTyping(
				from,
				{
					text: "*📋 Usage:* `-ref_update <old_company_name> <new_company_name>`\n\n_Example:_ `-ref_update Google Alphabet`",
				},
				{ quoted: msg },
			);
			return;
		}
		const [oldName, ...newNameParts] = args;
		const newCompanyName = newNameParts.join(" ");
		const result = await updateReferral(oldName, newCompanyName);
		if (!result.success) {
			const text =
				result.reason === "not_found"
					? `*❌ Company not found:* ${oldName}`
					: "*❌ Database error. Please try again.*";
			await sendMessageWTyping(from, { text }, { quoted: msg });
			return;
		}
		await sendMessageWTyping(
			from,
			{ text: `*✅ Company Updated*\n\n*Old Name:* ${oldName}\n*New Name:* ${newCompanyName}` },
			{ quoted: msg },
		);
	}
};

export default () => ({
	cmd: ["ref_delete", "ref_update"],
	desc: "Manage company referrals (delete/rename)",
	usage: "ref_delete <company> | ref_update <old> <new>",
	handler,
});
