import { getGroupData, group } from "../../../db/groupData.js";

// Admins must always be able to undo a block, so these can never be blocked themselves.
export const PROTECTED = new Set(["blockc", "emptyc", "getblockc", "removec"]);
const MAX_BLOCKED = 100;

// "Insta, HELP,insta" -> ["insta", "help"]: lower-cased (the dispatcher lower-cases the typed command,
// so "INSTA" would never have matched), trimmed, de-duplicated, sane characters only.
export const parseCommandList = (text) => [
	...new Set(
		String(text || "")
			.split(",")
			.map((c) => c.trim().toLowerCase())
			.filter((c) => c.length > 0 && c.length <= 40 && /^[a-z0-9_-]+$/.test(c)),
	),
];

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { command, isGroup, sendMessageWTyping } = msgInfoObj;
	if (!isGroup) return sendMessageWTyping(from, { text: "Use In Group Only!" }, { quoted: msg });

	const resBlock = await getGroupData(from);
	if (!resBlock)
		return sendMessageWTyping(from, { text: "No data found in DB for this group" }, { quoted: msg });
	const blockedNow = resBlock.cmdBlocked ?? [];

	switch (command) {
		case "blockc": {
			const wanted = parseCommandList(args.join(","));
			if (!wanted.length) return sendMessageWTyping(from, { text: `Enter a command to block` }, { quoted: msg });

			const refused = wanted.filter((c) => PROTECTED.has(c));
			const fresh = wanted.filter((c) => !PROTECTED.has(c) && !blockedNow.includes(c));
			let text = "";
			if (fresh.length && blockedNow.length + fresh.length > MAX_BLOCKED) {
				return sendMessageWTyping(from, { text: `Too many blocked commands (max ${MAX_BLOCKED}).` }, { quoted: msg });
			}
			if (fresh.length) {
				await group.updateOne({ _id: from }, { $addToSet: { cmdBlocked: { $each: fresh } } });
				text += "*Blocked* _" + fresh.join(", ") + "_ *in this group*.\n";
			}
			if (refused.length) text += `Can't block the block-management commands: _${refused.join(", ")}_.\n`;
			if (!fresh.length && !refused.length) text = "Command already blocked in this group";
			return sendMessageWTyping(from, { text: text.trim() }, { quoted: msg });
		}

		case "emptyc":
			await group.updateOne({ _id: from }, { $set: { cmdBlocked: [] } });
			return sendMessageWTyping(from, { text: `*No commands blocked in this group*` }, { quoted: msg });

		case "getblockc":
			return sendMessageWTyping(
				from,
				{ text: `*Commands Block in this Group are* : ${blockedNow.toString()}` },
				{ quoted: msg }
			);

		case "removec": {
			const wanted = parseCommandList(args.join(","));
			if (!wanted.length) return sendMessageWTyping(from, { text: `Enter a command to unblock` }, { quoted: msg });
			await group.updateOne({ _id: from }, { $pullAll: { cmdBlocked: wanted } });
			return sendMessageWTyping(from, { text: "*UnBlocked* _" + wanted.join(", ") + "_ *in this Group*." }, { quoted: msg });
		}

		default:
			break;
	}
};

export default () => ({
	cmd: ["blockc", "emptyc", "getblockc", "removec"],
	desc: "Block or unblock commands in this group. Aliases list or clear blocked ones.",
	usage: "blockc insta | insta,help",
	handler,
});
