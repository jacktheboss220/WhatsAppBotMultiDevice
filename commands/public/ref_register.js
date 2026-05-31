import { createReferral, updateUserRef } from "../../mongo-DB/referralsDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { command, senderJid, sendMessageWTyping, updateName } = msgInfoObj;

	if (command === "reg_ref") {
		if (args.length === 0) {
			await sendMessageWTyping(
				from,
				{ text: "*📋 Usage:* `-reg_ref <company name>`\n\n_Example:_ `-reg_ref Google`" },
				{ quoted: msg },
			);
			return;
		}
		const companyName = args.join(" ");
		const result = await createReferral(companyName, senderJid, updateName);
		if (result === null) {
			await sendMessageWTyping(
				from,
				{ text: "*❌ Database error. Please try again.*" },
				{ quoted: msg },
			);
			return;
		}
		if (!result.created) {
			if (result.reason === "already_registered") {
				await sendMessageWTyping(
					from,
					{
						text: `*ℹ️ You're already registered with:* ${companyName}\n\n_Use -ref_list to view all companies._`,
					},
					{ quoted: msg },
				);
			}
			return;
		}
		let responseMsg = `*✅ Registered Successfully*\n\n*Company:* ${companyName}\n*User:* ${updateName}`;
		if (result.moved) responseMsg += `\n\n_(Moved from previous company)_`;
		await sendMessageWTyping(from, { text: responseMsg }, { quoted: msg });
	} else if (command === "update_ref") {
		if (args.length === 0) {
			await sendMessageWTyping(
				from,
				{ text: "*📋 Usage:* `-update_ref <new company name>`\n\n_Example:_ `-update_ref Microsoft`" },
				{ quoted: msg },
			);
			return;
		}
		const newCompanyName = args.join(" ");
		const result = await updateUserRef(senderJid, newCompanyName);
		if (!result.success) {
			let text;
			if (result.reason === "user_not_found") {
				text = "*❌ You're not registered with any company yet.*\n\n_Use `-reg_ref <company name>` to register._";
			} else if (result.reason === "same_company") {
				text = "*ℹ️ You're already registered with this company.*";
			} else {
				text = "*❌ Database error. Please try again.*";
			}
			await sendMessageWTyping(from, { text }, { quoted: msg });
			return;
		}
		await sendMessageWTyping(
			from,
			{
				text: `*✅ Company Updated*\n\n*From:* ${result.oldCompany}\n*To:* ${newCompanyName}\n\n_Use -ref_list to view all companies._`,
			},
			{ quoted: msg },
		);
	}
};

export default () => ({
	cmd: ["reg_ref", "update_ref"],
	desc: "Register or update your company referral",
	usage: "reg_ref <company> | update_ref <new company>",
	handler,
});
