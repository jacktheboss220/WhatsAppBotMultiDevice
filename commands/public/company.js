import { searchReferrals } from "../../mongo-DB/referralsDb.js";

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, isGroupAdmin, isOwner } = msgInfoObj;

	const isGroup = from.endsWith("@g.us");

	if (isGroup && !isGroupAdmin && !isOwner) {
		await sendMessageWTyping(from, {
			text: "*🔍 This command is for admins only.*\n\n_Search via DM to the bot._",
		}, { quoted: msg });
		return;
	}

	if (args.length === 0) {
		await sendMessageWTyping(from, {
			text: "*📋 Usage:* `-company <company name>`\n\n_Example:_ `-company google`",
		}, { quoted: msg });
		return;
	}

	const searchTerm = args.join(" ");
	const results = await searchReferrals(searchTerm);

	if (results.length === 0) {
		await sendMessageWTyping(from, {
			text: `*🔍 No companies found matching:* ${searchTerm}`,
		}, { quoted: msg });
		return;
	}

	let message = `*🔍 Search results for:* ${searchTerm}\n\n`;
	const allJids = [];

	for (const company of results) {
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

	message += `_Total: ${results.length} company/companies_`;
	if (isGroup) message += "\n\n_For better experience, use -company via DM to the bot._";

	await sendMessageWTyping(from, { text: message, mentions: allJids }, { quoted: msg });
};

export default () => ({
	cmd: ["company"],
	desc: "Search companies by name",
	usage: "company <company name>",
	handler,
});