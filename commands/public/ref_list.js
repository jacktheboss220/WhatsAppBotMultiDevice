import { getAllReferrals } from "../../mongo-DB/referralsDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, isGroupAdmin, isOwner } = msgInfoObj;

	const isGroup = from.endsWith("@g.us");

	if (isGroup && !isGroupAdmin && !isOwner) {
		await sendMessageWTyping(from, {
			text: "*📋 Use -ref_list in DM to the bot for full features.*",
		}, { quoted: msg });
		return;
	}

	const allReferrals = await getAllReferrals();

	if (allReferrals.length === 0) {
		await sendMessageWTyping(from, {
			text: "*📋 No companies registered yet.*\n\n_Use `-reg_ref <company name>` to register._",
		}, { quoted: msg });
		return;
	}

	let message = "*📋 Company Referral List*\n\n";
	const allJids = [];

	for (const company of allReferrals) {
		if (isGroup) {
			const userLines = company.users.map((u) => `  • ${u.name || "Unknown"}`);
			message += `*🏢 ${company.companyName}*\n${userLines.join("\n")}\n\n`;
		} else {
			const userLines = company.users.map((u) => {
				allJids.push(u.jid);
				return `  • @${u.jid.split("@")[0]}`;
			});
			message += `*🏢 ${company.companyName}*\n${userLines.join("\n")}\n\n`;
		}
	}

	message += `_Total: ${allReferrals.length} company/companies_`;
	if (isGroup) message += "\n\n_For better experience, use -ref_list via DM to the bot._";

	await sendMessageWTyping(from, { text: message, mentions: allJids }, { quoted: msg });
};

export default () => ({
	cmd: ["ref_list"],
	desc: "View all companies and registered users",
	usage: "ref_list",
	handler,
});