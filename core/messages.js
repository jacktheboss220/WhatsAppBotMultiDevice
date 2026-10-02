import dotenv from "dotenv";
dotenv.config();

import messageQueue from "../queue/messageQueue.js";
import notifyOwner from "../notify/owner.js";
import { escapeHtml } from "../notify/telegram.js";
import { readFileEfficiently } from "../utils/file.js";
import { getGroupMeta, setGroupMeta, checkRateLimit } from "../cache/redisCache.js";

const prefix = process.env.PREFIX;
import { isModeratorJid } from "../utils/roles.js"; // moderators come from MODERATORS only (see utils/roles.js)
import getGroupAdmins from "../utils/groupAdmins.js";
import { extractPhoneNumber, getPNFromLID, isLID } from "../utils/lid.js";
import { createMembersData, getMemberData, member, migratePNToLID } from "../db/members.js";
import { createGroupData, getGroupData, group, migrateGroupMemberPNToLID } from "../db/groupData.js";
import {
	commandsPublic,
	commandsMembers,
	commandsAdmins,
	commandsOwners,
	commandsReadyPromise,
	commandsLoaded,
} from "../utils/commandLoader.js";
import { getBotData } from "../db/botData.js";
import { recordCommand } from "../db/cmdStats.js";
import groupMetaStore from "../cache/groupMetaStore.js";
import { saveChatMessage } from "../utils/chatLogger.js";
import { getRankUp } from "../utils/ranks.js";

// Short-lived cache for the globally-disabled command list — avoids a Mongo
// round trip on every single command (was previously fetched fresh each time).
let _disabledCache = { list: [], expiresAt: 0 };
const getDisabledGlobally = async () => {
	if (Date.now() < _disabledCache.expiresAt) return _disabledCache.list;
	const botData = await getBotData();
	_disabledCache = { list: botData?.disabledGlobally || [], expiresAt: Date.now() + 30_000 };
	return _disabledCache.list;
};

// These will be used for permission checks
const myNumber = [
	process.env.MY_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.MY_NUMBER.split(",")[1] + "@lid",
];
const botNumber = [
	process.env.BOT_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.BOT_NUMBER.split(",")[1] + "@lid",
];

// Cached tag sticker - loaded once at startup
let _tagStickerBuffer = null;
const getTagSticker = async () => {
	if (!_tagStickerBuffer) {
		_tagStickerBuffer = await readFileEfficiently("./media/tag.webp");
	}
	return _tagStickerBuffer;
};

const getCommand = async (sock, msg, cache) => {
	if (!commandsLoaded) await commandsReadyPromise;
	const startTime = process.hrtime();

	try {
		if (!sock || !sock.user) return;
		const messageKeys = Object.keys(msg.message);
		if (messageKeys.length === 0) return;
		if (msg.key.fromMe && !msg.key.remoteJid) return;

		// On first group send after idle, WA bundles senderKeyDistributionMessage + messageContextInfo
		// alongside the real content type. Pick the first known content type key directly.
		const _contentTypes = new Set([
			"conversation",
			"imageMessage",
			"videoMessage",
			"extendedTextMessage",
			"buttonsResponseMessage",
			"templateButtonReplyMessage",
			"listResponseMessage",
			"stickerMessage",
			"documentMessage",
			"audioMessage",
		]);

		const sendMessageWTyping = async (to, msgObj, messageOptions) => {
			try {
				if (!to || !msgObj) return;
				if (!sock || !sock.user) return;

				const mediaTypes = ["sticker", "image", "audio", "video", "document"];
				const messageType = Object.keys(msgObj)[0];
				const isGroupChat = to.endsWith("@g.us");

				if (mediaTypes.includes(messageType)) {
					if (typeof msgObj[messageType] === "string") {
						try {
							msgObj[messageType] = await readFileEfficiently(msgObj[messageType]);
						} catch (readErr) {
							console.error("❌ Error reading media file:", readErr.message);
							throw readErr;
						}
					}
				}

				const doSend = async () => {
					if (!isGroupChat) {
						sock.presenceSubscribe(to).catch(() => {});
						await new Promise((resolve) => setTimeout(resolve, 300));
						sock.sendPresenceUpdate("composing", to).catch(() => {});
						await new Promise((resolve) => setTimeout(resolve, 500));
					}

					try {
						const sendOptions = {
							...messageOptions,
							mediaUploadTimeoutMs: isGroupChat ? 1000 * 60 * 10 : 1000 * 60 * 5,
						};

						await sock.sendMessage(to, msgObj, sendOptions);
					} catch (err) {
						console.error("❌ Error sending message:", err.message);
						throw err;
					} finally {
						if (!isGroupChat) {
							sock.sendPresenceUpdate("paused", to).catch(() => {});
						}
					}
				};

				if (isGroupChat) {
					const priority = mediaTypes.includes(messageType) ? 2 : 1;
					messageQueue
						.enqueue(to, doSend, priority)
						.catch((e) => console.error("[queue enqueue error]", e.message));
					return;
				} else {
					await messageQueue.enqueue(to, doSend, 0);
				}
				return;
			} catch (error) {
				console.error("❌ Error in sendMessageWTyping:", error.message);
				throw error;
			}
		};

		const from = msg.key.remoteJid;
		const content = JSON.stringify(msg.message);
		const type = messageKeys.find((k) => _contentTypes.has(k)) ?? messageKeys[0];

		const m = msg.message || {};

		const bodyMap = {
			conversation: m.conversation,
			imageMessage: m.imageMessage?.caption,
			videoMessage: m.videoMessage?.caption,
			extendedTextMessage: m.extendedTextMessage?.text,
			buttonsResponseMessage: m.buttonsResponseMessage?.selectedDisplayText,
			templateButtonReplyMessage: m.templateButtonReplyMessage?.selectedDisplayText,
			listResponseMessage: m.listResponseMessage?.title,
		};

		let body = bodyMap[type] ?? ""; // handles null + undefined
		body = String(body).trim();

		let types = [
			"conversation",
			"imageMessage",
			"videoMessage",
			"extendedTextMessage",
			"buttonsResponseMessage",
			"templateButtonReplyMessage",
			"listResponseMessage",
			"stickerMessage",
			"documentMessage",
		];

		const extendedMessageOriginal =
			type === "extendedTextMessage" ? msg.message.extendedTextMessage.contextInfo : null;
		// console.log("extendedMessageOriginal:", JSON.stringify(extendedMessageOriginal, null, 2));

		if (!types.includes(type)) return;

		if (type == "buttonsResponseMessage") {
			if (msg.message.buttonsResponseMessage.selectedButtonId == "eva")
				body = body.startsWith(prefix) ? body : prefix + body;
		} else if (type == "templateButtonReplyMessage") {
			body = body.startsWith(prefix) ? body : prefix + body;
		} else if (type == "listResponseMessage") {
			if (msg.message.listResponseMessage.singleSelectReply.selectedRowId == "eva")
				body = body.startsWith(prefix) ? body : prefix + body;
		}

		if (body[1] == " ") body = body[0] + body.slice(2);
		// "-" alone, "--", "-_-", "- " etc. are plain chat, not commands: need a letter/digit right after the prefix
		const isCmd = body.startsWith(prefix) && /^[a-z0-9]/i.test(body.slice(prefix.length));
		const evv = body
			.trim()
			.split(/ +/)
			.slice(isCmd ? 1 : 0)
			.join(" ");
		const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
		const args = body.trim().split(/ +/).slice(1);
		//-------------------------------------------------------------------------------------------------------------//
		const isGroup = from.endsWith("@g.us");
		const senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;
		const isOwner = myNumber.includes(senderJid);
		if (!senderJid || !senderJid.includes("@")) return;

		// Migrate the old @s.whatsapp.net member doc to the new @lid one, learned
		// from Baileys 7's participantAlt (group) / remoteJidAlt (dm) on this message.
		const senderJidAlt = isGroup ? msg.key.participantAlt : msg.key.remoteJidAlt;
		if (senderJidAlt && isLID(senderJid)) {
			await migratePNToLID(senderJid, senderJidAlt);
			if (isGroup) await migrateGroupMemberPNToLID(from, senderJid, senderJidAlt);
		}

		const updateId = msg.key.fromMe ? botNumber[0] : senderJid;
		const updateName = msg.key.fromMe ? sock.user.name : msg.pushName;

		// Determine media type field for counting
		const mediaTypeField =
			type === "conversation" || type === "extendedTextMessage"
				? "texttotal"
				: type === "imageMessage"
					? "imagetotal"
					: type === "videoMessage"
						? "videototal"
						: type === "stickerMessage"
							? "stickertotal"
							: type === "documentMessage"
								? "pdftotal"
								: null;

		if (mediaTypeField) {
			let updatedDoc = null;
			try {
				[updatedDoc] = await Promise.all([
					member.findOneAndUpdate(
						{ _id: updateId },
						{
							$inc: { totalmsg: 1, [mediaTypeField]: 1 },
							$set: { username: updateName },
							$setOnInsert: { isBlock: false, dmLimit: 99999, warning: [] },
						},
						{ returnDocument: "after", upsert: true },
					),
					createMembersData(updateId, updateName),
				]);
			} catch (e) {
				console.error("[member update error]", e.message);
			}

			if (isGroup) {
				setImmediate(async () => {
					try {
						const snapId = updateId;
						const updated = await group.findOneAndUpdate(
							{ _id: from, "members.id": updateId },
							{
								$inc: { "members.$.count": 1, [`members.$.${mediaTypeField}`]: 1 },
								$set: { "members.$.name": updateName },
							},
							{ returnDocument: "after" },
						);

						if (!updated) {
							const newMember = {
								id: updateId,
								name: updateName,
								count: 1,
								texttotal: 0,
								imagetotal: 0,
								videototal: 0,
								stickertotal: 0,
								pdftotal: 0,
							};
							newMember[mediaTypeField] = 1;
							// Push only if nobody else did meanwhile: two first messages arriving together used to
							// each push an entry, splitting that member's counts across duplicates.
							const pushed = await group.updateOne(
								{ _id: from, "members.id": { $ne: updateId } },
								{ $push: { members: newMember } },
							);
							if (pushed.matchedCount === 0) {
								await group.updateOne(
									{ _id: from, "members.id": updateId },
									{ $inc: { "members.$.count": 1, [`members.$.${mediaTypeField}`]: 1 } },
								);
							}
						} else {
							// Check rank-up using per-group count
							const memberEntry = updated.members?.find((m) => m.id === snapId);
							const grpCount = memberEntry?.count || 0;
							const rankUp = getRankUp(grpCount);
							if (rankUp) {
								const grpCheck = await group.findOne({ _id: from }, { projection: { isRankNotifOn: 1 } });
								if (grpCheck?.isRankNotifOn) {
									const text = rankUp.congrats
										? `🎉 @${snapId.split("@")[0]} completed *${grpCount.toLocaleString()}* messages in this group! 💎`
										: `🎉 *Rank Up!*\n${rankUp.emoji} *${rankUp.name}*\n@${snapId.split("@")[0]} just hit *${grpCount.toLocaleString()}* messages in this group! 🚀`;
									await sendMessageWTyping(from, { text, mentions: [snapId] });
								}
							}
						}
						await group.updateOne({ _id: from }, { $inc: { totalMsgCount: 1 } });
					} catch (e) {
						console.error("[group member update error]", e.message);
					}
				});
			}
		}

		// Return early for non-command sticker and document messages (no further processing needed)
		if (!isCmd && (type == "stickerMessage" || type == "documentMessage")) return;
		//-------------------------------------------------------------------------------------------------------------//

		let groupMetadata = "";
		let groupData = "";
		if (isGroup) {
			// NodeCache first (no network), then Redis, then live fetch
			groupMetadata = cache.get(from + ":groupMetadata") || (await getGroupMeta(from));
			if (groupMetadata) groupMetaStore.set(from, groupMetadata);
			if (!groupMetadata) {
				try {
					// Commands need real admin data (empty list => false "bot is not admin"), so wait longer for them
					groupMetadata = await Promise.race([
						sock.groupMetadata(from),
						new Promise((_, reject) =>
							setTimeout(() => reject(new Error("Group metadata fetch timeout")), isCmd ? 10000 : 2000),
						),
					]);
					groupMetaStore.set(from, groupMetadata);
					setGroupMeta(from, groupMetadata); // Redis (async, non-blocking)
					cache.set(from + ":groupMetadata", groupMetadata, 60 * 60); // NodeCache fallback
					createGroupData(from, groupMetadata).catch((e) =>
						console.error("[createGroupData error]", e.message),
					);
				} catch (e) {
					console.error("Group metadata fetch failed:", e.message);
					// Not cached, so the next message retries. Commands bail instead of guessing admin status.
					if (isCmd) return;
					groupMetadata = { participants: [] };
				}
			}
		}
		if (msg.message.extendedTextMessage) {
			const rawMentioned = msg.message.extendedTextMessage.contextInfo?.mentionedJid;
			const mentioned = Array.isArray(rawMentioned) ? rawMentioned : rawMentioned ? [rawMentioned] : [];
			if (mentioned.includes(botNumber[0]) || mentioned.includes(botNumber[1])) {
				try {
					const stickerBuffer = await getTagSticker();
					sendMessageWTyping(from, { sticker: stickerBuffer }, { quoted: msg });
				} catch (err) {
					console.error("Failed to send tag sticker:", err.message);
				}
			}
		}
		const senderNumber = senderJid.includes(":") ? senderJid.split(":")[0] : senderJid.split("@")[0];
		if (senderJid !== updateId) {
			createMembersData(senderJid, msg.pushName);
		}
		// Parallelize member and group data fetch, but don't block main thread
		let senderData = null;
		let groupDataFetched = null;
		try {
			[senderData, groupDataFetched] = await Promise.all([
				getMemberData(senderJid),
				isGroup ? getGroupData(from) : Promise.resolve(""),
			]);
		} catch (e) {
			senderData = null;
			groupDataFetched = null;
		}
		if (isGroup) groupData = groupDataFetched;
		if (isGroup && type == "imageMessage" && groupData?.isAutoStickerOn && !senderData?.isBlock) {
			// Only images sent WITHOUT a caption. A caption-less image has caption === null in this Baileys
			// version (was `== ""`, which is false for null, so auto sticker never triggered).
			if (!msg.message.imageMessage.caption) {
				commandsPublic["sticker"](sock, msg, from, args, {
					senderJid,
					type,
					content,
					isGroup,
					sendMessageWTyping,
					evv,
				}).catch((e) => console.error("[autosticker error]", e.message));
			}
		}
		//-------------------------------------------------------------------------------------------------------------//
		if (senderData?.isBlock) return;
		// Log text messages to chat history for gemini summarization.
		// Only in groups where the bot is switched on (it used to log every group, even ones that never opted in),
		// and only after the blocked-user check.
		// Skip: commands (prefix), eva triggers, bot's own messages
		const isEvaTrigger = body.trim().split(" ")[0].toLowerCase() === "eva";
		if (
			isGroup &&
			groupData?.isBotOn &&
			body &&
			!isCmd &&
			!isEvaTrigger &&
			!msg.key.fromMe &&
			(type === "conversation" || type === "extendedTextMessage")
		) {
			setImmediate(async () => {
				try {
					let replyTo = null;
					const ctx = msg.message?.extendedTextMessage?.contextInfo;
					if (ctx?.quotedMessage) {
						const qText =
							ctx.quotedMessage.conversation || ctx.quotedMessage.extendedTextMessage?.text || "";
						const qSender = ctx.participant || "";
						let qName = "";
						if (qSender) {
							const qMember = await getMemberData(qSender).catch(() => null);
							qName = qMember?.username || "";
						}
						replyTo = { sender: qSender, senderName: qName, text: qText };
					}
					let mentions = [];
					const mentionedJids = ctx?.mentionedJid || [];
					if (mentionedJids.length > 0) {
						mentions = await Promise.all(
							mentionedJids.map(async (jid) => {
								const memberData = await getMemberData(jid).catch(() => null);
								return { jid, name: memberData?.username || jid.split("@")[0] };
							}),
						);
					}
					await saveChatMessage(from, senderJid, updateName || msg.pushName || "", body, replyTo, mentions);
				} catch (e) {
					console.error("[chatLogger error]", e.message);
				}
			});
		}
		const groupAdmins = isGroup ? getGroupAdmins(groupMetadata.participants) : "";
		const isGroupAdmin = groupAdmins?.includes(senderJid) || false;

		//--------------------------------------------CHAT-BOT-FEATURE------------------------------------------------//
		const isChatBotOn = groupData ? groupData.isChatBotOn : false;
		if (isGroup && isChatBotOn && (type == "conversation" || type == "extendedTextMessage")) {
			let isTaggedBot = false;
			let tagMessage = null;
			if (type == "extendedTextMessage") {
				let tagMessageSenderJID = msg.message?.extendedTextMessage?.contextInfo?.participant;
				isTaggedBot = tagMessageSenderJID === botNumber[0] || tagMessageSenderJID === botNumber[1];
				tagMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
			}
			if (
				body.split(" ")[0].toLowerCase() == "eva" ||
				(isTaggedBot &&
					Object.keys(tagMessage)[0] == "conversation" &&
					tagMessage?.conversation.startsWith("_*Eva:*_"))
			) {
				commandsPublic["eva"](sock, msg, from, args, {
					sendMessageWTyping,
					command,
					updateName:
						updateName == "" || updateName == null || updateName == undefined
							? senderData?.username
							: updateName,
					updateId,
					senderJid,
					groupMetadata,
					groupAdmins,
					isGroup,
					evv,
					isOwner,
				});
				notifyOwner(
					sock,
					`🤖 <b>Command Used</b>\n` +
						`━━━━━━━━━━━━━━\n` +
						`📌 <b>Command:</b> <code>chat</code>\n` +
						`👤 <b>User:</b> ${escapeHtml(msg.pushName)}\n` +
						`📱 <b>ID:</b> <code>${escapeHtml(senderJid)}</code>\n` +
						`💬 <b>In:</b> ${escapeHtml(groupMetadata.subject)}`,
					msg,
				);
			}
		}
		//---------------------------------------------------NO-CMD----------------------------------------------------//
		if (!isCmd) return;
		//-------------------------------------------------------------------------------------------------------------//
		// Rate limit: 3 calls per 5s per user per command (owners exempt)
		// if (!isOwner) {
		// const allowed = await checkRateLimit(senderJid, command);
		// if (!allowed) return console.log("Rate limit exceeded for", senderJid, "command:", command);

		// }
		const isKnown = !!(commandsPublic[command] || commandsMembers[command] || commandsAdmins[command] || commandsOwners[command]);
		// Unknown words after the prefix ("- yes", "-5") are usually normal chat: stay silent unless it looks like a typo
		sock.readMessages([msg.key]).catch(() => {});

		const msgInfoObj = {
			prefix,
			type,
			content,
			evv,
			command,
			isGroup,
			senderJid,
			groupMetadata,
			groupAdmins,
			isGroupAdmin,
			botNumber,
			sendMessageWTyping,
			notifyOwner,
			updateName,
			updateId,
			isOwner,
			startTime,
			extendedMessageOriginal,
		};
		const displayFrom = senderJid.endsWith("@s.whatsapp.net")
			? extractPhoneNumber(senderJid)
			: extractPhoneNumber((await Promise.resolve(getPNFromLID(sock, senderJid))) || senderJid);
		console.log(
			"[COMMAND]",
			command,
			"[FROM]",
			displayFrom,
			"[name]",
			msg.pushName,
			"[IN]",
			isGroup ? groupMetadata.subject : "Directs",
		);
		if (isKnown) notifyOwner(
			sock,
			`🤖 <b>Command Used</b>\n` +
				`━━━━━━━━━━━━━━\n` +
				`📌 <b>Command:</b> <code>${escapeHtml(command)}</code>\n` +
				`👤 <b>User:</b> ${escapeHtml(msg.pushName)}\n` +
				`📱 <b>ID:</b> <code>${escapeHtml(displayFrom)}</code>\n` +
				`💬 <b>In:</b> ${escapeHtml(isGroup ? groupMetadata.subject : "Direct Message")}`,
			msg,
		);
		if (command != "") {
			const globallyDisabled = await getDisabledGlobally();
			if (globallyDisabled.includes(command)) {
				return sendMessageWTyping(from, { text: `🚫 This command is globally disabled.` }, { quoted: msg });
			}
		}
		if (isGroup) {
			let resBotOn = groupData ? await groupData.isBotOn : false;
			if (isKnown && resBotOn == false && !(command.startsWith("group") || command.startsWith("dev") || command === "toggle")) {
				return sendMessageWTyping(from, {
					text:
						"```By default, bot is turned off in this group.\nAsk the Owner to activate.\n\nUse ```" +
						prefix +
						"dev",
				});
			}
			let blockCommandsInDB = groupData?.cmdBlocked ?? [];
			if (command != "") {
				if (blockCommandsInDB.includes(command)) {
					return sendMessageWTyping(from, { text: `Command blocked for this group.` }, { quoted: msg });
				}
			}
		}
		// Track command usage for admin dashboard
		const { pushActivity, cmdUsage } = await import("../notify/adminEvents.js");
		if (commandsPublic[command] || commandsMembers[command] || commandsAdmins[command] || commandsOwners[command]) {
			cmdUsage.set(command, (cmdUsage.get(command) || 0) + 1);
			recordCommand(command, isGroup ? from : null);
			pushActivity("command_used", {
				cmd: command,
				from: senderJid,
				name: msg.pushName || senderJid.split("@")[0],
				group: isGroup ? groupMetadata?.subject || "Group" : "DM",
			});
		}
		if (commandsPublic[command]) {
			const t0 = Date.now();
			const result = await commandsPublic[command](sock, msg, from, args, msgInfoObj);
			const t1 = Date.now();
			console.log(`[PROFILE] Command '${command}' (public) took ${t1 - t0}ms`);
			return result;
		} else if (commandsMembers[command]) {
			const t0 = Date.now();
			let result;
			if (isGroup || msg.key.fromMe) {
				result = await commandsMembers[command](sock, msg, from, args, msgInfoObj);
			} else {
				result = await sendMessageWTyping(
					from,
					{ text: "```❎ This command is only applicable in Groups!```" },
					{ quoted: msg },
				);
			}
			const t1 = Date.now();
			console.log(`[PROFILE] Command '${command}' (members) took ${t1 - t0}ms`);
			return result;
		} else if (commandsAdmins[command]) {
			const t0 = Date.now();
			let result;
			if (!isGroup) {
				result = await sendMessageWTyping(
					from,
					{ text: "```❎ This command is only applicable in Groups!```" },
					{ quoted: msg },
				);
			} else if (isGroupAdmin || myNumber.includes(senderJid) || (await isModeratorJid(sock, senderJid, senderJidAlt))) {
				result = await commandsAdmins[command](sock, msg, from, args, msgInfoObj);
			} else {
				result = await sendMessageWTyping(
					from,
					{ text: "```🤭 kya matlab tum admin nhi ho.```" },
					{ quoted: msg },
				);
			}
			const t1 = Date.now();
			console.log(`[PROFILE] Command '${command}' (admins) took ${t1 - t0}ms`);
			return result;
		} else if (commandsOwners[command]) {
			const t0 = Date.now();
			let result;
			if (myNumber.includes(senderJid) || (await isModeratorJid(sock, senderJid, senderJidAlt))) {
				result = await commandsOwners[command](sock, msg, from, args, msgInfoObj);
			} else {
				result = await sendMessageWTyping(
					from,
					{ text: "```🤭 kya matlab tum mere owner nhi ho.```" },
					{ quoted: msg },
				);
			}
			const t1 = Date.now();
			console.log(`[PROFILE] Command '${command}' (owners) took ${t1 - t0}ms`);
			return result;
		} else {
			const allCmds = [
				...Object.keys(commandsPublic),
				...Object.keys(commandsMembers),
				...Object.keys(commandsAdmins),
				...Object.keys(commandsOwners),
			];
			const lev = (a, b) => {
				const dp = Array.from({ length: a.length + 1 }, (_, i) =>
					Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
				);
				for (let i = 1; i <= a.length; i++)
					for (let j = 1; j <= b.length; j++)
						dp[i][j] =
							a[i - 1] === b[j - 1]
								? dp[i - 1][j - 1]
								: 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
				return dp[a.length][b.length];
			};
			let best = null,
				bestDist = Infinity;
			for (const c of allCmds) {
				const d = lev(command, c);
				if (d < bestDist) {
					bestDist = d;
					best = c;
				}
			}
			const threshold = command.length > 4 ? 2 : 1; // short words ("no", "yes") are chat, only suggest near-misses
			if (best && bestDist <= threshold) {
				return sendMessageWTyping(
					from,
					{ text: `Did you mean *${prefix}${best}*?` },
					{ quoted: msg },
				);
			}
			return; // not a command and not a close typo: ignore
		}
	} catch (error) {
		console.error("❌ Error processing message:", error.message);
		console.error("📍 Error stack:", error.stack);
		console.error(
			"📝 Message details:",
			JSON.stringify(
				{
					from: msg?.key?.remoteJid,
					id: msg?.key?.id,
					fromMe: msg?.key?.fromMe,
					messageType: Object.keys(msg?.message || {})[0],
				},
				null,
				2,
			),
		);
		if (sock?.user && msg?.key?.remoteJid) {
			setTimeout(() => {
				sock.sendMessage(
					msg.key.remoteJid,
					{
						text: "❌ Sorry, I encountered an error processing your message. Please try again.",
					},
					{ quoted: msg },
				).catch(() => {});
			}, 1000);
		}
	}
};

export default getCommand;
