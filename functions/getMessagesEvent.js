import dotenv from "dotenv";
dotenv.config();

import messageQueue from "./messageQueue.js";
import notifyOwner from "./getOwnerSend.js";
import { readFileEfficiently } from "./fileUtils.js";

const prefix = process.env.PREFIX;
const moderatos = [...process.env.MODERATORS?.split(",")];
import getGroupAdmins from "./getGroupAdmins.js";
import { stickerForward, forwardGroup } from "../functions/getStickerForward.js";
import { createMembersData, getMemberData, member } from "../mongo-DB/membersDataDb.js";
import { createGroupData, getGroupData, group } from "../mongo-DB/groupDataDb.js";
import { commandsPublic, commandsMembers, commandsAdmins, commandsOwners } from "./getAddCommands.js";
import { getBotData } from "../mongo-DB/botDataDb.js";

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
	const startTime = process.hrtime();

	try {
		if (!sock || !sock.user) return;
		if (sock.startupTime && Date.now() - sock.startupTime < 1000) return;
		const messageKeys = Object.keys(msg.message);
		if (messageKeys.length === 0) return;
		if (msg.key.fromMe && !msg.key.remoteJid) return;

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
							mediaUploadTimeoutMs: isGroupChat ? 1000 * 60 * 10 : 1000 * 60 * 5, // 10min for groups, 5min for DMs
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
					messageQueue.enqueue(to, doSend, priority).catch((e) => console.error("[queue enqueue error]", e.message));
					return;
				} else {
					await messageQueue.enqueue(to, doSend, 0); // Highest priority for DMs
				}
				return;
			} catch (error) {
				console.error("❌ Error in sendMessageWTyping:", error.message);
				throw error;
			}
		};

		const from = msg.key.remoteJid;
		const content = JSON.stringify(msg.message);
		const type = Object.keys(msg.message)[0];

		if (type === "stickerMessage" && forwardGroup != "") {
			stickerForward(sock, msg, from);
		}

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
		const isCmd = body.startsWith(prefix);
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

		const updateId = msg.key.fromMe ? botNumber[0] : senderJid;
		const updateName = msg.key.fromMe ? sock.user.name : msg.pushName;

		// Determine media type field for counting
		const mediaTypeField =
			type === "conversation" || type === "extendedTextMessage" ? "texttotal" :
			type === "imageMessage" ? "imagetotal" :
			type === "videoMessage" ? "videototal" :
			type === "stickerMessage" ? "stickertotal" :
			type === "documentMessage" ? "pdftotal" : null;

		if (mediaTypeField) {
			await Promise.all([
				member.updateOne(
					{ _id: updateId },
					{ $inc: { totalmsg: 1, [mediaTypeField]: 1 }, $set: { username: updateName } }
				),
				createMembersData(updateId, updateName),
			]).catch((e) => console.error("[member update error]", e.message));

			if (isGroup) {
				setImmediate(async () => {
					try {
						const r = await group.updateOne(
							{ _id: from, "members.id": updateId },
							{
								$inc: { "members.$.count": 1, [`members.$.${mediaTypeField}`]: 1 },
								$set: { "members.$.name": updateName },
							}
						);
						if (r.matchedCount === 0) {
							const newMember = {
								id: updateId, name: updateName, count: 1,
								texttotal: 0, imagetotal: 0, videototal: 0, stickertotal: 0, pdftotal: 0,
							};
							newMember[mediaTypeField] = 1;
							await group.updateOne(
								{ _id: from },
								{ $push: { members: newMember } }
							);
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
			groupMetadata = cache.get(from + ":groupMetadata");
			if (!groupMetadata) {
				try {
					groupMetadata = await Promise.race([
						sock.groupMetadata(from),
						new Promise((_, reject) =>
							setTimeout(() => reject(new Error("Group metadata fetch timeout")), 2000)
						),
					]);
					cache.set(from + ":groupMetadata", groupMetadata, 10 * 60); // 10 min
					createGroupData(from, groupMetadata).catch((e) => console.error("[createGroupData error]", e.message));
				} catch (e) {
					console.error("Group metadata fetch failed:", e.message);
					groupMetadata = { participants: [] };
				}
			}
		}
		if (msg.message.extendedTextMessage) {
			if (
				msg.message.extendedTextMessage.contextInfo?.mentionedJid == botNumber[0] ||
				msg.message.extendedTextMessage.contextInfo?.mentionedJid == botNumber[1]
			) {
				try {
					const stickerBuffer = await getTagSticker();
					sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
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
		if (isGroup && type == "imageMessage" && groupData?.isAutoStickerOn) {
			if (msg.message.imageMessage.caption == "") {
				commandsPublic["sticker"](sock, msg, from, args, {
					senderJid,
					type,
					content,
					isGroup,
					sendMessageWTyping,
					evv,
				});
			}
		}
		//-------------------------------------------------------------------------------------------------------------//
		if (senderData?.isBlock) return;
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
					`👤 <b>User:</b> ${msg.pushName}\n` +
					`📱 <b>ID:</b> <code>${senderJid}</code>\n` +
					`💬 <b>In:</b> ${groupMetadata.subject}`,
					msg
				);
			}
		}
		//---------------------------------------------------NO-CMD----------------------------------------------------//
		if (!isCmd) return;
		//-------------------------------------------------------------------------------------------------------------//
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
		};
		console.log(
			"[COMMAND]",
			command,
			"[FROM]",
			senderJid,
			"[name]",
			msg.pushName,
			"[IN]",
			isGroup ? groupMetadata.subject : "Directs"
		);
		notifyOwner(
			sock,
			`🤖 <b>Command Used</b>\n` +
			`━━━━━━━━━━━━━━\n` +
			`📌 <b>Command:</b> <code>${command}</code>\n` +
			`👤 <b>User:</b> ${msg.pushName}\n` +
			`📱 <b>ID:</b> <code>${senderJid}</code>\n` +
			`💬 <b>In:</b> ${isGroup ? groupMetadata.subject : "Direct Message"}`,
			msg
		);
		if (command != "") {
			const botData = await getBotData();
			const globallyDisabled = botData?.disabledGlobally || [];
			if (globallyDisabled.includes(command)) {
				return sendMessageWTyping(from, { text: `🚫 This command is globally disabled.` }, { quoted: msg });
			}
		}
		if (isGroup) {
			let resBotOn = groupData ? await groupData.isBotOn : false;
			if (resBotOn == false && !(command.startsWith("group") || command.startsWith("dev"))) {
				return sendMessageWTyping(from, {
					text:
						"```By default, bot is turned off in this group.\nAsk the Owner to activate.\n\nUse ```" +
						prefix +
						"dev",
				});
			}
			let blockCommandsInDB = await groupData?.cmdBlocked;
			if (command != "") {
				if (blockCommandsInDB.includes(command)) {
					return sendMessageWTyping(from, { text: `Command blocked for this group.` }, { quoted: msg });
				}
			}
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
					{ quoted: msg }
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
					{ quoted: msg }
				);
			} else if (isGroupAdmin || moderatos.includes(senderNumber) || myNumber.includes(senderJid)) {
				result = await commandsAdmins[command](sock, msg, from, args, msgInfoObj);
			} else {
				result = await sendMessageWTyping(
					from,
					{ text: "```🤭 kya matlab tum admin nhi ho.```" },
					{ quoted: msg }
				);
			}
			const t1 = Date.now();
			console.log(`[PROFILE] Command '${command}' (admins) took ${t1 - t0}ms`);
			return result;
		} else if (commandsOwners[command]) {
			const t0 = Date.now();
			let result;
			if (moderatos.includes(senderNumber) || myNumber.includes(senderJid)) {
				result = await commandsOwners[command](sock, msg, from, args, msgInfoObj);
			} else {
				result = await sendMessageWTyping(
					from,
					{ text: "```🤭 kya matlab tum mere owner nhi ho.```" },
					{ quoted: msg }
				);
			}
			const t1 = Date.now();
			console.log(`[PROFILE] Command '${command}' (owners) took ${t1 - t0}ms`);
			return result;
		} else {
			return sendMessageWTyping(
				from,
				{ text: "```" + msg.pushName + " !!Use " + prefix + "help ```" },
				{ quoted: msg }
			);
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
				2
			)
		);
		if (sock && sock.user && msg && msg.key && msg.key.remoteJid) {
			setTimeout(async () => {
				try {
					await sock.sendMessage(msg.key.remoteJid, {
						text: "❌ Sorry, I encountered an error processing your message. Please try again in a moment.",
					});
				} catch (sendError) {
					console.error("❌ Failed to send error message:", sendError.message);
				}
			}, 1000);
		}
	}
};

export default getCommand;
