require("dotenv").config();
const { delay } = require("@adiwajshing/baileys");

const fs = require("fs");

const ownerSend_sock = require("./getOwnerSend");

const prefix = process.env.PREFIX;
const moderatos = ["918318585418", ...process.env.MODERATORS?.split(",")];
const getGroupAdmins = require("./getGroupAdmins");

const stickerForward = require("../stickerForward");
const { createMembersData, getMemberData, member } = require("../mongo-DB/membersDataDb");
const { createGroupData, getGroupData, group } = require("../mongo-DB/groupDataDb");
const { commandsPublic, commandsMembers, commandsAdmins, commandsOwners } = require("./getAddCommands");
const myNumber = process.env.MY_NUMBER;
let forwardGroup = "";

const getCommand = async (sock, msg, cache) => {
    //-------------------------------------------------------------------------------------------------------------//
    async function ownerSend(mass) {
        ownerSend_sock(sock, mass, msg);
    }
    //-------------------------------------------------------------------------------------------------------------//
    const sendMessageWTyping = async (jid, option1, option2) => {
        await sock.presenceSubscribe(jid);
        await delay(500);

        await sock.sendPresenceUpdate("composing", jid);
        await delay(2000);

        await sock.sendPresenceUpdate("paused", jid);
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
    botNumberJid = botNumberJid.includes(":")
        ? botNumberJid.split(":")[0] + "@s.whatsapp.net"
        : botNumberJid;
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
    //-------------------------------------------------------------------------------------------------------------//
    //-------------------------------------------------------------------------------------------------------------//
    //-------------------------------------------------------------------------------------------------------------//
    if (type == "buttonsResponseMessage") {
        if (msg.message.buttonsResponseMessage.selectedButtonId == "eva")
            body = body.startsWith(prefix) ? body : prefix + body;
    } else if (type == "templateButtonReplyMessage") {
        body = body.startsWith(prefix) ? body : prefix + body;
    } else if (type == "listResponseMessage") {
        if (msg.message.listResponseMessage.singleSelectReply.selectedRowId == "eva")
            body = body.startsWith(prefix) ? body : prefix + body;
    }
    //-------------------------------------------------------------------------------------------------------------//
    if (body[1] == " ") body = body[0] + body.slice(2);
    const evv = body.trim().split(/ +/).slice(1).join(" ");
    const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    //-------------------------------------------------------------------------------------------------------------//
    const isCmd = body.startsWith(prefix);
    if (!isCmd && (type == "videoMessage" || type == "stickerMessage")) return;
    //-------------------------------------------------------------------------------------------------------------//
    const isGroup = from.endsWith("@g.us");
    const senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;
    //--------------------------------------------------Count------------------------------------------------------//
    const updateId = msg.key.fromMe ? botNumberJid : senderJid;
    const updateName = msg.key.fromMe ? sock.user.name : msg.pushName;
    if (type == "conversation" || type == "extendedTextMessage") {
        member.updateOne(
            { _id: updateId },
            { $inc: { totalmsg: 1 } },
            { $set: { username: updateName } }
        ); //19-10-2022
        createMembersData(updateId, updateName);
    }
    //-------------------------------------------------------------------------------------------------------------//
    let groupMetadata = "";
    if (isGroup && (type == "conversation" || type == "extendedTextMessage")) {
        groupMetadata = cache.get(from + ":groupMetadata");
        if (!groupMetadata) {
            groupMetadata = await sock.groupMetadata(from);
            const success = cache.set(
                from + ":groupMetadata",
                groupMetadata,
                60 * 60
            );
            createGroupData(from, groupMetadata);
        }
        group.updateOne(
            { _id: from, "members.id": updateId },
            {
                $inc: { "members.$.count": 1 },
                $set: { "members.$.name": updateName },
            }).then((r) => {
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
            sock.sendMessage(
                from,
                { sticker: fs.readFileSync("./media/tag.webp") },
                { quoted: msg }
            );
        }
    }
    //--------------------------------------------------SENDER-----------------------------------------------------//
    const senderNumber = senderJid.includes(":")
        ? senderJid.split(":")[0]
        : senderJid.split("@")[0];
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
            if (senderData?.isBlock)
                return ownerSend("User Blocked : " + senderJid);
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
    //-------------------------------------------------------------------------------------------------------------//
    if (isGroup && (type == "conversation" || type == "extendedTextMessage") && senderJid != botNumberJid && senderJid != "") {
        let UU = ['u', 'u only', 'u onli', 'u lavde', 'Uuu'].map((v) => v.toLowerCase());
        let random = Math.floor(Math.random() * UU.length);
        if (UU.includes(body.toLowerCase())) {
            sock.sendMessage(from, { text: UU[random] }, { quoted: msg });
        }
    }
    //---------------------------------------------------NO-CMD----------------------------------------------------//
    if (!isCmd) return;
    //-------------------------------------------------READ-SEEN---------------------------------------------------//
    await sock.readMessages([msg.key]);
    //------------------------------------------------GROUP-DATA---------------------------------------------------//
    const groupAdmins = isGroup
        ? getGroupAdmins(groupMetadata.participants)
        : "";
    const isGroupAdmin = groupAdmins.includes(senderJid) || false;
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
        ownerSend,
    };
    //-------------------------------------------------------------------------------------------------------------//
    console.log("[COMMAND]", command, "[FROM]", senderNumber, "[name]", msg.pushName, "[IN]", isGroup ? groupMetadata.subject : "Directs");
    ownerSend(`📝: ${prefix}${command} by ${msg.pushName}(+${senderNumber}) in ${isGroup ? groupMetadata.subject : "DM"}`);
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
                return sendMessageWTyping(
                    from,
                    { text: `Command blocked for this group.` },
                    { quoted: msg }
                );
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
            return sendMessageWTyping(
                from,
                { text: "```🤭 kya matlab tum admin nhi ho.```" },
                { quoted: msg }
            );
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
};

module.exports = getCommand;