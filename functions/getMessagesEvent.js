require("dotenv").config();
const { delay } = require("baileys");

const fs = require("fs");

const logOwner = require("./getOwnerSend");

const prefix = process.env.PREFIX;
const moderatos = [...process.env.MODERATORS?.split(",")];
const getGroupAdmins = require("./getGroupAdmins");

const { stickerForward, forwardGroup } = require("../functions/getStickerForward");
const { createMembersData, getMemberData, member } = require("../mongo-DB/membersDataDb");
const { createGroupData, getGroupData, group } = require("../mongo-DB/groupDataDb");
const { commandsPublic, commandsMembers, commandsAdmins, commandsOwners } = require("./getAddCommands");
const myNumber = process.env.MY_NUMBER;

const getCommand = async (sock, msg, cache) => {
	const startTime = process.hrtime();

	try {
		// Ensure socket is ready and connected
		if (!sock || !sock.user) {
			console.log("⚠️ Socket not ready, skipping message processing");
			return;
		}

		// Basic message validation
		if (!msg || !msg.key || !msg.message) {
			console.log("⚠️ Invalid message structure, skipping");
			return;
		}

		//-------------------------------------------------------------------------------------------------------------//
		const sendMessageWTyping = async (jid, option1, option2) => {
			// await sock.presenceSubscribe(jid);
			// await delay(500);

			// await sock?.sendPresenceUpdate("composing", jid);
			// await delay(2000);
			// await sock?.sendPresenceUpdate("paused", jid);

			await sock.sendMessage(jid, option1, {
				...option2,
				mediaUploadTimeoutMs: 1000 * 60 * 60,
			});
		};
		//-------------------------------------------------------------------------------------------------------------//
		const from = msg.key.remoteJid;
		const content = JSON.stringify(msg.message);
		const type = Object.keys(msg.message)[0];

		//-------------------------------------------------------------------------------------------------------------//
		if (type === "stickerMessage" && forwardGroup != "") {
			stickerForward(sock, msg, from);
		}
		//-------------------------------------------------------------------------------------------------------------//
		let botNumberJid = sock.user.id;
		botNumberJid = botNumberJid.includes(":") ? botNumberJid.split(":")[0] + "@s.whatsapp.net" : botNumberJid;
		//-------------------------------------------------------------------------------------------------------------//
		//--------------------------------------------------BODY-------------------------------------------------------//
		//-------------------------------------------------------------------------------------------------------------//
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

		let types = [
			"conversation",
			"imageMessage",
			"videoMessage",
			"extendedTextMessage",
			"buttonsResponseMessage",
			"templateButtonReplyMessage",
			"listResponseMessage",
		];

		if (!types.includes(type)) {
			return;
		}
		//-------------------------------------------------------------------------------------------------------------//
		//-------------------------------------------------------------------------------------------------------------//
		//-------------------------------------------------------------------------------------------------------------//
		if (body[1] == " ") body = body[0] + body.slice(2);
		const evv = body.trim().split(/ +/).slice(1).join(" ");
		const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
		const args = body.trim().split(/ +/).slice(1);
		//-------------------------------------------------------------------------------------------------------------//
		const isCmd = body.startsWith(prefix);
		if (!isCmd && type == "stickerMessage") return;
		//-------------------------------------------------------------------------------------------------------------//
		const isGroup = from.endsWith("@g.us");
		const senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;
		const isOwner = senderJid == myNumber ? true : false;

		if (senderJid == "" || senderJid == null) return;
		//--------------------------------------------------Count------------------------------------------------------//
		const updateId = msg.key.fromMe ? botNumberJid : senderJid;
		const updateName = msg.key.fromMe ? sock.user.name : msg.pushName;
		if (type == "conversation" || type == "extendedTextMessage") {
			member.updateOne({ _id: updateId }, { $inc: { totalmsg: 1 } }, { $set: { username: updateName } }); //19-10-2022
			await createMembersData(updateId, updateName);
		}
		//-------------------------------------------------------------------------------------------------------------//
		let groupMetadata = "";
		if (isGroup) {
			groupMetadata = cache.get(from + ":groupMetadata");
			if (!groupMetadata) {
				groupMetadata = await sock.groupMetadata(from);
				const success = cache.set(from + ":groupMetadata", groupMetadata, 60 * 60);
				await createGroupData(from, groupMetadata);
			}
		}
		if (isGroup && (type == "conversation" || type == "extendedTextMessage")) {
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
								$push: {
									members: { id: updateId, name: updateName, count: 1 },
								},
							}
						);
					}
				});
			group.updateOne({ _id: from }, { $inc: { totalMsgCount: 1 } }); //19-10-2022
		}
		//-------------------------------------------------------------------------------------------------------------//
		if (msg.message.extendedTextMessage) {
			if (msg.message.extendedTextMessage.contextInfo?.mentionedJid == botNumberJid) {
				sock.sendMessage(from, { sticker: fs.readFileSync("./media/tag.webp") }, { quoted: msg });
			}
		}
		//--------------------------------------------------SENDER-----------------------------------------------------//
		const senderNumber = senderJid.includes(":") ? senderJid.split(":")[0] : senderJid.split("@")[0];
		// Ensure sender data exists in database before fetching
		if (senderJid !== updateId) {
			await createMembersData(senderJid, msg.pushName);
		}
		const senderData = await getMemberData(senderJid);
		const groupData = isGroup ? await getGroupData(from) : "";
		//-------------------------------------------------------------------------------------------------------------//
		if (isGroup && type == "imageMessage" && groupData?.isAutoStickerOn) {
			if (msg.message.imageMessage.caption == "") {
				console.log("Sticker Created");
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
		//---------------------------------------------IS-BLOCK--------------------------------------------------------//
		if (senderData?.isBlock) return;
		//-------------------------------------------------ChatBot-----------------------------------------------------//
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
		//-------------------------------------------------READ-SEEN---------------------------------------------------//
		await sock.readMessages([msg.key]);
		//------------------------------------------------GROUP-DATA---------------------------------------------------//
		const groupAdmins = isGroup ? getGroupAdmins(groupMetadata.participants) : "";
		const isGroupAdmin = groupAdmins?.includes(senderJid) || false;
		// const groupData = isGroup ? await getGroupData(from) : "";
		//-------------------------------------------------------------------------------------------------------------//
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
		//-------------------------------------------------------------------------------------------------------------//
		console.log(
			"[COMMAND]",
			command,
			"[FROM]",
			senderNumber,
			"[name]",
			msg.pushName,
			"[IN]",
			isGroup ? groupMetadata.subject : "Directs"
		);
		logOwner(
			sock,
			`📝: ${prefix}${command} by ${msg.pushName}(+${senderNumber}) in ${isGroup ? groupMetadata.subject : "DM"}`,
			msg
		);
		//-------------------------------------------------BLOCK-CMDs--------------------------------------------------//
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
		//-------------------------------------------------------------------------------------------------------------//
		//---------------------------------------------------COMMANDS--------------------------------------------------//
		//-------------------------------------------------------------------------------------------------------------//

		if (commandsPublic[command]) {
			return commandsPublic[command](sock, msg, from, args, msgInfoObj);
		} else if (commandsMembers[command]) {
			if (isGroup || msg.key.fromMe) {
				return commandsMembers[command](sock, msg, from, args, msgInfoObj);
			} else {
				return sendMessageWTyping(
					from,
					{ text: "```❎ This command is only applicable in Groups!```" },
					{ quoted: msg }
				);
			}
		} else if (commandsAdmins[command]) {
			if (!isGroup) {
				return sendMessageWTyping(
					from,
					{ text: "```❎ This command is only applicable in Groups!```" },
					{ quoted: msg }
				);
			} else if (isGroupAdmin || moderatos.includes(senderNumber)) {
				return commandsAdmins[command](sock, msg, from, args, msgInfoObj);
			} else {
				return sendMessageWTyping(from, { text: "```🤭 kya matlab tum admin nhi ho.```" }, { quoted: msg });
			}
		} else if (commandsOwners[command]) {
			if (moderatos.includes(senderNumber) || myNumber == senderJid) {
				return commandsOwners[command](sock, msg, from, args, msgInfoObj);
			} else {
				return sendMessageWTyping(
					from,
					{ text: "```🤭 kya matlab tum mere owner nhi ho.```" },
					{ quoted: msg }
				);
			}
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

		// Only send error message if we have sufficient context and socket is ready
		if (sock && sock.user && msg && msg.key && msg.key.remoteJid) {
			try {
				// Add delay to avoid overwhelming the connection
				setTimeout(async () => {
					try {
						await sock.sendMessage(msg.key.remoteJid, {
							text: "❌ Sorry, I encountered an error processing your message. Please try again in a moment.",
						});
					} catch (sendError) {
						console.error("❌ Failed to send error message:", sendError.message);
					}
				}, 1000); // 1 second delay
			} catch (sendError) {
				console.error("❌ Failed to schedule error message:", sendError.message);
			}
		}
	}
};

module.exports = getCommand;
