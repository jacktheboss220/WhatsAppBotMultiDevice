import { getAllReferrals, searchReferrals } from "../../db/referrals.js";
const readMore = String.fromCharCode(8206).repeat(4000);

const buildMessage = (companies, isGroup, header) => {
	let message = header;
	const allJids = [];

	for (const [index, company] of companies.entries()) {
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

		if (index === 1) {
			message += `${readMore}`;
		}
	}

	return { message, allJids };
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { command, sendMessageWTyping, isGroupAdmin, isOwner } = msgInfoObj;

	const isGroup = from.endsWith("@g.us");

	// if (isGroup && !isGroupAdmin && !isOwner) {
	// 	const dmHint = command === "ref_list"
	// 		? "*📋 Use -ref_list in DM to the bot for full features.*"
	// 		: "*🔍 This command is for admins only.*\n\n_Search via DM to the bot._";
	// 	await sendMessageWTyping(from, { text: dmHint }, { quoted: msg });
	// 	return;
	// }

	if (command === "ref_list") {
		const allReferrals = await getAllReferrals();

		if (allReferrals.length === 0) {
			await sendMessageWTyping(
				from,
				{ text: "*📋 No companies registered yet.*\n\n_Use `-reg_ref <company name>` to register._" },
				{ quoted: msg },
			);
			return;
		}

		const { message, allJids } = buildMessage(allReferrals, isGroup, "*📋 Company Referral List*\n\n");
		const footer =
			`_Total: ${allReferrals.length} company/companies_` +
			(isGroup ? "\n\n_For better experience, use -ref_list via DM to the bot._" : "");
		await sendMessageWTyping(from, { text: message + footer, mentions: allJids }, { quoted: msg });
	} else if (command === "company") {
		if (args.length === 0) {
			await sendMessageWTyping(
				from,
				{ text: "*📋 Usage:* `-company <company name>`\n\n_Example:_ `-company google`" },
				{ quoted: msg },
			);
			return;
		}

		const searchTerm = args.join(" ");
		const results = await searchReferrals(searchTerm);

		if (results.length === 0) {
			await sendMessageWTyping(
				from,
				{ text: `*🔍 No companies found matching:* ${searchTerm}` },
				{ quoted: msg },
			);
			return;
		}

		const { message, allJids } = buildMessage(results, isGroup, `*🔍 Search results for:* ${searchTerm}\n\n`);
		const footer =
			`_Total: ${results.length} company/companies_` +
			(isGroup ? "\n\n_For better experience, use -company via DM to the bot._" : "");
		await sendMessageWTyping(from, { text: message + footer, mentions: allJids }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["ref_list", "company"],
	desc: "View all companies or search by name",
	usage: "ref_list | company <name>",
	handler,
});
