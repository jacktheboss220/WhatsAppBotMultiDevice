import { updateUserRef } from "../../mongo-DB/referralsDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { senderJid, sendMessageWTyping, updateName } = msgInfoObj;

	if (args.length === 0) {
		await sendMessageWTyping(from, {
			text: "*📋 Usage:* `-update_ref <new company name>`\n\n_Example:_ `-update_ref Microsoft`",
		}, { quoted: msg });
		return;
	}

	const newCompanyName = args.join(" ");
	const result = await updateUserRef(senderJid, newCompanyName);

	if (!result.success) {
		if (result.reason === "user_not_found") {
			await sendMessageWTyping(from, {
				text: "*❌ You're not registered with any company yet.*\n\n_Use `-reg_ref <company name>` to register._",
			}, { quoted: msg });
		} else if (result.reason === "same_company") {
			await sendMessageWTyping(from, {
				text: "*ℹ️ You're already registered with this company.*",
			}, { quoted: msg });
		} else {
			await sendMessageWTyping(from, {
				text: "*❌ Database error. Please try again.*",
			}, { quoted: msg });
		}
		return;
	}

	await sendMessageWTyping(from, {
		text: `*✅ Company Updated*\n\n*From:* ${result.oldCompany}\n*To:* ${newCompanyName}\n\n_Use -ref_list to view all companies._`,
	}, { quoted: msg });
};

export default () => ({
	cmd: ["update_ref"],
	desc: "Update your company registration",
	usage: "update_ref <new company name>",
	handler,
});