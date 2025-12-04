import dotenv from "dotenv";
dotenv.config();

import messageQueue from "./messageQueue.js";
import notifyOwner from "./getOwnerSend.js";
import { readFileEfficiently } from "./fileUtils.js";

const prefix = process.env.PREFIX;
const moderatos = ["918318585418", ...process.env.MODERATORS?.split(",")];
import getGroupAdmins from "./getGroupAdmins.js";
import { stickerForward, forwardGroup } from "../functions/getStickerForward.js";
import { createMembersData, getMemberData, member } from "../mongo-DB/membersDataDb.js";
import { createGroupData, getGroupData, group } from "../mongo-DB/groupDataDb.js";
import { commandsPublic, commandsMembers, commandsAdmins, commandsOwners } from "./getAddCommands.js";

// Support both LID and PN formats for bot owner numbers
// These will be used for permission checks
const myNumber = [
	process.env.MY_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.MY_NUMBER.split(",")[1] + "@lid",
];
const botNumber = [
	process.env.BOT_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.BOT_NUMBER.split(",")[1] + "@lid",
];

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

				// Only use presence updates for DMs, skip for groups to improve performance
				const isGroupChat = to.endsWith("@g.us");

				// Define the actual send function
				const doSend = async () => {
					if (!isGroupChat) {
						// Reduced delays for DMs only
						sock.presenceSubscribe(to).catch(() => {});
						await new Promise((resolve) => setTimeout(resolve, 300));
						sock.sendPresenceUpdate("composing", to).catch(() => {});
						await new Promise((resolve) => setTimeout(resolve, 800));
					}

					try {
						await sock.sendMessage(to, msgObj, {
							...messageOptions,
							mediaUploadTimeoutMs: 1000 * 60 * 5, // Reduced to 5 minutes
						});
					} catch (err) {
						console.error("❌ Error sending message:", err.message);
						throw err;
					} finally {
						if (!isGroupChat) {
							sock.sendPresenceUpdate("paused", to).catch(() => {});
						}
					}
				};

				// Use queue for groups to prevent CPU overload
				if (isGroupChat) {
					// Priority: text=1, media=2 (lower number = higher priority)
					const priority = mediaTypes.includes(messageType) ? 2 : 1;
					await messageQueue.enqueue(to, doSend, priority);
				} else {
					// Send DMs directly without queueing
					await doSend();
				}
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
		const evv = body.trim().split(/ +/).slice(1).join(" ");
		const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
		const args = body.trim().split(/ +/).slice(1);
		const isCmd = body.startsWith(prefix);
		//-------------------------------------------------------------------------------------------------------------//
		if (!isCmd && type == "stickerMessage") return;
		//-------------------------------------------------------------------------------------------------------------//
		const isGroup = from.endsWith("@g.us");
		const senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;
		const isOwner = myNumber.includes(senderJid);
		if (!senderJid || !senderJid.includes("@")) return;

		const updateId = msg.key.fromMe ? botNumber[0] : senderJid;
		const updateName = msg.key.fromMe ? sock.user.name : msg.pushName;
		// Parallelize member update and creation
		if (type == "conversation" || type == "extendedTextMessage") {
			Promise.all([
				member.updateOne({ _id: updateId }, { $inc: { totalmsg: 1 } }, { $set: { username: updateName } }),
				createMembersData(updateId, updateName),
			]);
		}

		let groupMetadata = "";
		let groupData = "";
		if (isGroup) {
			groupMetadata = cache.get(from + ":groupMetadata");
			if (!groupMetadata) {
				// Fetch group metadata with a timeout to avoid blocking
				try {
					groupMetadata = await Promise.race([
						sock.groupMetadata(from),
						new Promise((_, reject) =>
							setTimeout(() => reject(new Error("Group metadata fetch timeout")), 2000)
						),
					]);
					cache.set(from + ":groupMetadata", groupMetadata, 60 * 60);
					// Fire and forget DB write
					createGroupData(from, groupMetadata).catch(() => {});
				} catch (e) {
					console.error("Group metadata fetch failed:", e.message);
					groupMetadata = { participants: [] };
				}
			}
		}
		if (isGroup && (type == "conversation" || type == "extendedTextMessage")) {
			// Debounce group member updates to avoid DB overload
			setTimeout(() => {
				group
					.updateOne(
						{ _id: from, "members.id": updateId },
						{
							$inc: { "members.$.count": 1 },
							$set: { "members.$.name": updateName },
						}
					)
					.then((r) => {
						if (r.matchedCount == 0) {
							group
								.updateOne(
									{ _id: from },
									{
										$push: { members: { id: updateId, name: updateName, count: 1 } },
									}
								)
								.catch(() => {});
						}
					})
					.catch(() => {});
				group.updateOne({ _id: from }, { $inc: { totalMsgCount: 1 } }).catch(() => {});
			}, 100);
		}
		if (msg.message.extendedTextMessage) {
			if (
				msg.message.extendedTextMessage.contextInfo?.mentionedJid == botNumber[0] ||
				msg.message.extendedTextMessage.contextInfo?.mentionedJid == botNumber[1]
			) {
				// Async file read for sticker
				try {
					const stickerBuffer = await readFileEfficiently("./media/tag.webp");
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
		if (senderData?.isBlock) return;
		if (type == "conversation" || type == "extendedTextMessage") {
			if (body.split(" ")[0].toLowerCase() == "eva" || body.split(" ")[0].toLowerCase() == "gemini") {
				const isChatBotOn = groupData ? groupData.isChatBotOn : false;
				if (isChatBotOn) {
					commandsPublic["eva"](sock, msg, from, args, {
						evv,
						sendMessageWTyping,
						isGroup,
					});
				}
			}
		}
		//---------------------------------------------------NO-CMD----------------------------------------------------//
		if (!isCmd) return;
		await sock.readMessages([msg.key]);
		const groupAdmins = isGroup ? getGroupAdmins(groupMetadata.participants) : "";
		const isGroupAdmin = groupAdmins?.includes(senderJid) || false;
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
			"[COMMAND] " +
				command +
				" [FROM] " +
				senderJid +
				" [name] " +
				msg.pushName +
				" [IN] " +
				(isGroup ? groupMetadata.subject : "Directs"),
			msg
		);
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
