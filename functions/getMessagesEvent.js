require("dotenv").config();
const fs = require("fs");

const logOwner = require("./getOwnerSend");
const { validateMessageObject, sanitizeMessageContent } = require("./systemCleanup");
const { readFileEfficiently } = require("./fileUtils");

const prefix = process.env.PREFIX;
const moderatos = [...process.env.MODERATORS?.split(",")];
const getGroupAdmins = require("./getGroupAdmins");

const { stickerForward, forwardGroup } = require("../functions/getStickerForward");
const { createMembersData, getMemberData, member } = require("../mongo-DB/membersDataDb");
const { createGroupData, getGroupData, group } = require("../mongo-DB/groupDataDb");
const { commandsPublic, commandsMembers, commandsAdmins, commandsOwners } = require("./getAddCommands");
const myNumber = [
	process.env.MY_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.MY_NUMBER.split(",")[1] + "@lid",
];

const getCommand = async (sock, msg, cache) => {
	const startTime = process.hrtime();

	try {
		if (!sock || !sock.user) return;
		if (sock.startupTime && Date.now() - sock.startupTime < 1000) return;
		if (!validateMessageObject(msg)) return;
		const messageKeys = Object.keys(msg.message);
		if (messageKeys.length === 0) return;
		if (msg.key.fromMe && !msg.key.remoteJid) return;

		const sendMessageWTyping = async (jid, option1, option2) => {
			try {
				if (!jid || !option1) return;
				if (option1.text !== undefined) {
					const sanitized = sanitizeMessageContent(option1.text);
					if (!sanitized) return;
					option1.text = sanitized;
				}
				if (!sock || !sock.user) return;

				// Async media file reading for images, stickers, audio, video
				const mediaTypes = ["image", "sticker", "audio", "video", "document"];
				for (const type of mediaTypes) {
					if (option1[type] && typeof option1[type] === "string") {
						// If a file path is provided, read it efficiently
						option1[type] = await readFileEfficiently(option1[type]);
					}
					if (option1[type] && Buffer.isBuffer(option1[type])) {
						console.log(
							`[sendMessageWTyping] Media type: ${type}, Buffer size: ${option1[type].length} bytes`
						);
					}
				}

				await sock.sendMessage(jid, option1, {
					...option2,
					mediaUploadTimeoutMs: 1000 * 60 * 60,
				});
			} catch (error) {
				console.error("❌ Error in sendMessageWTyping:", error);
			}
		};

		const from = msg.key.remoteJid;
		const content = JSON.stringify(msg.message);
		const type = Object.keys(msg.message)[0];

		if (type === "stickerMessage" && forwardGroup != "") {
			stickerForward(sock, msg, from);
		}

		let botNumberJid = sock.user.id;
		botNumberJid = botNumberJid.includes(":") ? botNumberJid.split(":")[0] + "@s.whatsapp.net" : botNumberJid;

		let body =
			type === "conversation"
				? msg.message.conversation
				: type == "imageMessage" && msg.message.imageMessage.caption
				? msg.message.imageMessage.caption
				: type == "videoMessage" && msg.message.videoMessage.caption
				? msg.message.videoMessage.caption
				: type == "extendedTextMessage" && msg.message.extendedTextMessage.text
				? msg.message.extendedTextMessage.text
				: type == "buttonsResponseMessage"
				? msg.message.buttonsResponseMessage.selectedDisplayText
				: type == "templateButtonReplyMessage"
				? msg.message.templateButtonReplyMessage.selectedDisplayText
				: type == "listResponseMessage"
				? msg.message.listResponseMessage.title
				: "";
		if (body === null || body === undefined) body = "";
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
		if (!isCmd && type == "stickerMessage") return;
		const isGroup = from.endsWith("@g.us");
		const senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;
		const isOwner = myNumber.includes(senderJid);
		if (!senderJid || !senderJid.includes("@")) return;

		const updateId = msg.key.fromMe ? botNumberJid : senderJid;
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
				groupMetadata = await sock.groupMetadata(from);
				cache.set(from + ":groupMetadata", groupMetadata, 60 * 60);
				createGroupData(from, groupMetadata);
			}
		}
		if (isGroup && (type == "conversation" || type == "extendedTextMessage")) {
			Promise.all([
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
							group.updateOne(
								{ _id: from },
								{
									$push: { members: { id: updateId, name: updateName, count: 1 } },
								}
							);
						}
					}),
				group.updateOne({ _id: from }, { $inc: { totalMsgCount: 1 } }),
			]);
		}
		if (msg.message.extendedTextMessage) {
			if (msg.message.extendedTextMessage.contextInfo?.mentionedJid == botNumberJid) {
				sock.sendMessage(from, { sticker: fs.readFileSync("./media/tag.webp") }, { quoted: msg });
			}
		}
		const senderNumber = senderJid.includes(":") ? senderJid.split(":")[0] : senderJid.split("@")[0];
		if (senderJid !== updateId) {
			createMembersData(senderJid, msg.pushName);
		}
		// Parallelize member and group data fetch
		const [senderData, groupDataFetched] = await Promise.all([
			getMemberData(senderJid),
			isGroup ? getGroupData(from) : Promise.resolve(""),
		]);
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
			botNumberJid,
			sendMessageWTyping,
			logOwner,
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
		logOwner(
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
			} else if (isGroupAdmin || moderatos.includes(senderNumber)) {
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

module.exports = getCommand;
