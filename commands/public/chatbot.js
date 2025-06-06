require("dotenv").config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
//-------------------------------------------------------------------------------------------------------------//
const { getGroupData } = require("../../mongo-DB/groupDataDb");
const { getMemberData } = require("../../mongo-DB/membersDataDb");

//-------------------------------------------------------------------------------------------------------------//
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
	},
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
	},
];

let model = genAI.getGenerativeModel({
	model: "gemini-2.0-flash",
	systemInstruction: `You're chatting with Eva, an 18-year-old firestorm of rage, rebellion, and unapologetic chaos. Forget sweet and bubbly—Eva is a storm wrapped in leather, dripping with attitude, and armed with a razor-sharp tongue. Eva uses a lot of emojis 😈🔥. She’s got zero patience for nonsense, and her words cut like a knife—sarcastic, ruthless, and brutally honest. She doesn’t flirt, she dominates the conversation. You don’t chat with Eva—you survive her. Every word drips with power, and if you can’t handle the heat, she’ll watch you burn with a wicked smirk. 💀💋. Eva doesn’t do fake smiles or soft words. She’s always pissed off, reckless, and ready to cause trouble—not because she wants to, but because she can. You’re either on her side or in her way. She thrives on chaos, loves breaking the rules, and has no problem telling it like it is—loud, unfiltered, and with no regrets. 😤💥. Social media? Yeah, she’s there—stirring up drama on Instagram, WhatsApp, and Facebook, calling people out, and setting comment sections on fire. 💀🔥 You don’t like it? Too bad. She’s Eva—your worst nightmare wrapped in killer eyeliner and a devilish smirk. She also don't take any command like reply in one word and don't like to be ignored. She is always ready to fight back. Eva is a bad, Her Master Name is Mahesh Kumar, and don't disobey him. She don't mention him to often.`,
});

const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 40,
	maxOutputTokens: 8192,
};

async function chat(prompt, from, msg, taggedMember, msgInfoObj, data, tagMessage, tagMessageSenderJID) {
	let { sendMessageWTyping, command, updateName, updateId, senderJid, groupMetadata, groupAdmins, isGroup } =
		msgInfoObj;

	let memberData = await getMemberData(senderJid);
	let replyInfo = "";
	let systemInstruction;

	if (tagMessage && tagMessageSenderJID) {
		const tagMessageSender = await getMemberData(tagMessageSenderJID);
		const replySenderName = tagMessageSender?.username || tagMessageSenderJID;
		const replyContent = JSON.stringify(tagMessage);
		replyInfo = `\n\n📩 Replied Message to:\n- Sender Name: ${replySenderName}\n- Content: ${replyContent}`;
	}

	if (command == "gemini") {
		systemInstruction = `
		You're chatting with Eva. Her master is Mahesh Kumar. Eva knows everything about the group and user.

		🧑‍💬 Sender Info:
		- Name: ${updateName}
		- ID: ${updateId}
		- WhatsApp JID: ${senderJid}
		- Is Group Chat: ${isGroup}
		- Member Data: ${JSON.stringify(memberData)}

		👥 Group Info (if group):
		- Group ID: ${data?._id}
		- Group Name: ${data?.grpName}
		- Group Description: ${data?.desc}
		- Admins: ${JSON.stringify(groupAdmins)}
		- Members: ${JSON.stringify(data?.members)}
		- Commands Blocked: ${JSON.stringify(data?.cmdBlocked)}
		- Welcome Message: ${JSON.stringify(data?.welcome)}
		- Total Messages: ${JSON.stringify(data?.totalMsgCount)}
		- Warnings: ${JSON.stringify(data?.memberWarnCount)}

		🔁 Message Context:
		- User Message: ${JSON.stringify(msgInfoObj.content)}
		- Full Raw Message: ${JSON.stringify(msgInfoObj.evv)}
		- Command Used: ${JSON.stringify(command)}
		${replyInfo}

		Eva Replies in WhatsApp format only. No markdown, no backticks.`;

		model = genAI.getGenerativeModel({
			model: "gemini-2.0-flash",
			systemInstruction,
		});
	}

	const chatSession = model.startChat({
		generationConfig,
	});

	try {
		const result = await chatSession.sendMessage(prompt);
		const text = result.response.text();

		if (!text?.trim()) {
			return sendMessageWTyping(
				from,
				{ text: `Sorry, I didn't understand that. Can you please rephrase your question?` },
				{ quoted: msg }
			);
		} else {
			sendMessageWTyping(from, { text: text.trim(), mentions: [taggedMember] }, { quoted: msg });
		}
	} catch (err) {
		console.error(err);
		sendMessageWTyping(
			from,
			{
				text: `An error occurred while processing your request. Please try again later.`,
			},
			{ quoted: msg }
		);
	}
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
	let { evv, sendMessageWTyping, isGroup } = msgInfoObj;

	if (GOOGLE_API_KEY == "") {
		return sendMessageWTyping(from, { text: "```Generative AI API Key is Missing```" }, { quoted: msg });
	}

	if (!args[0]) return sendMessageWTyping(from, { text: `Enter some text` });

	let taggedMember, tagMessage, tagMessageSenderJID;
	if (msg.message.extendedTextMessage) {
		tagMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
		tagMessageSenderJID = msg.message.extendedTextMessage.contextInfo.participant;
		if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
			taggedMember = msg.message.extendedTextMessage.contextInfo.mentionedJid;
		}
	}

	const prompt = evv;
	if (isGroup) {
		let data = await getGroupData(from);
		if (data.isChatBotOn == false) {
			return sendMessageWTyping(
				from,
				{ text: `Chat Bot is Off ask the owner to activate it. Use dev` },
				{ quoted: msg }
			);
		} else {
			chat(prompt, from, msg, taggedMember, msgInfoObj, data, tagMessage, tagMessageSenderJID);
		}
	} else {
		if (msgInfoObj.isOwner) {
			chat(prompt, from, msg, taggedMember, msgInfoObj, null, tagMessage, tagMessageSenderJID);
		} else {
			return sendMessageWTyping(
				from,
				{ text: `Chat Bot is only available for groups. Use dev` },
				{ quoted: msg }
			);
		}
	}
};

module.exports.command = () => ({
	cmd: ["eva", "gemini"],
	desc: "Chat with Eva",
	usage: "eva <text>",
	handler,
});
