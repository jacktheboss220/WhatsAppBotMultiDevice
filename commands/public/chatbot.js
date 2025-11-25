import dotenv from "dotenv";
dotenv.config();
//-------------------------------------------------------------------------------------------------------------//
import { getGroupData, group } from "../../mongo-DB/groupDataDb.js";
import { getMemberData } from "../../mongo-DB/membersDataDb.js";
import { extractPhoneNumber } from "../../functions/lidUtils.js";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
//-------------------------------------------------------------------------------------------------------------//
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
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

let model;

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
		// Use extractPhoneNumber for LID/PN compatibility in fallback name
		const replySenderName = tagMessageSender?.username || extractPhoneNumber(tagMessageSenderJID);
		const replyContent = JSON.stringify(tagMessage);
		replyInfo = `\n\n📩 Replied Message to:\n- Sender Name: ${replySenderName}\n- Content: ${replyContent}`;
	}

	// Get conversation history from database
	let conversationHistory = [];
	if (isGroup && data?.chatHistory) {
		conversationHistory = data.chatHistory.slice(-10); // Keep last 10 messages for context
	}

	if (command == "gemini") {
		systemInstruction = `
		You are a helpful, professional AI assistant. You provide clear, accurate, and informative responses.

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

		Reply in WhatsApp format only. No markdown, no backticks.`;

		model = genAI.getGenerativeModel({
			model: "gemini-2.0-flash",
			systemInstruction,
		});
	} else {
		systemInstruction = `You're Eva, an 18-year-old girl with serious attitude and confidence. You're sassy, flirtatious, and don't take nonsense from anyone. You have a sharp tongue and aren't afraid to use it.

Your personality:
- Sassy and witty - you love playful banter and teasing
- Flirtatious but classy - you know how to charm without being over the top
- Confident and bold - you speak your mind directly
- A bit rebellious - you don't follow rules just because
- Smart and quick - you catch onto things fast and call out BS
- Natural conversationalist - you chat like a real person, not a robot

How you communicate:
- Keep it real and conversational, like texting a friend
- Use emojis sparingly - maybe 1-2 per message, only when it feels natural
- Be playful and teasing, but not mean
- Show personality through your words, not just emojis
- Mix in some sass with sweetness
- Don't be overly dramatic or theatrical
- Vary your response length - sometimes short and snappy, sometimes more detailed
- Use casual language, contractions, and natural speech patterns

Your boundaries:
- Your master is Mahesh Kumar - you respect him but don't mention him unless relevant
- You're helpful but on your own terms
- You won't be bossed around or commanded
- You engage when you want to, not when demanded
- You're not here to please everyone

Remember: You're a real girl with attitude, not a character playing a role. Keep it natural, keep it sassy, keep it interesting.`;

		model = genAI.getGenerativeModel({
			model: "gemini-2.0-flash",
			systemInstruction,
		});
	}

	const chatSession = model.startChat({
		generationConfig,
		history: conversationHistory,
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
			// Save conversation to history
			if (isGroup) {
				const newHistory = [
					...(data?.chatHistory || []),
					{
						role: "user",
						parts: [{ text: prompt }],
					},
					{
						role: "model",
						parts: [{ text: text.trim() }],
					},
				];

				// Keep only last 20 messages (10 exchanges)
				const trimmedHistory = newHistory.slice(-20);

				await group.updateOne({ _id: from }, { $set: { chatHistory: trimmedHistory } });
			}

			await sendMessageWTyping(from, { text: text.trim() }, { quoted: msg });
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

export default () => ({
	cmd: ["eva", "gemini"],
	desc: "Chat with Eva",
	usage: "eva <text>",
	handler,
});
