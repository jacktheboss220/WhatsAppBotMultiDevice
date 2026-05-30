import { createReferral } from "../../mongo-DB/referralsDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { senderJid, sendMessageWTyping, updateName } = msgInfoObj;

	if (args.length === 0) {
		await sendMessageWTyping(from, {
			text: "*📋 Usage:* `-reg_ref <company name>`\n\n_Example:_ `-reg_ref Google`",
		}, { quoted: msg });
		return;
	}

	const companyName = args.join(" ");
	const result = await createReferral(companyName, senderJid, updateName);

	if (result === null) {
		await sendMessageWTyping(from, {
			text: "*❌ Database error. Please try again.*",
		}, { quoted: msg });
		return;
	}

	if (!result.created) {
		if (result.reason === "already_registered") {
			await sendMessageWTyping(from, {
				text: `*ℹ️ You're already registered with:* ${companyName}\n\n_Use -ref_list to view all companies._`,
			}, { quoted: msg });
		}
		return;
	}

	let responseMsg = `*✅ Registered Successfully*\n\n*Company:* ${companyName}\n*User:* ${updateName}`;
	if (result.moved) {
		responseMsg += `\n\n_(Moved from previous company)_`;
	}

	await sendMessageWTyping(from, {
		text: responseMsg,
	}, { quoted: msg });
};

export default () => ({
	cmd: ["reg_ref"],
	desc: "Register yourself with a company",
	usage: "reg_ref <company name>",
	handler,
});