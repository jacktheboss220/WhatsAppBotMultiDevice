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

const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 40,
	maxOutputTokens: 2600, // Limit output to ~2600 tokens (around 2000 words)
};

// Define models ONCE - not recreated every time
const geminiModel = genAI.getGenerativeModel({
	model: "gemini-2.0-flash",
	systemInstruction: `You are a helpful, professional AI assistant. You provide clear, accurate, and informative responses. Pay attention to who is speaking in each message. Reply in WhatsApp format only. No markdown, no backticks.`,
});

const evaModel = genAI.getGenerativeModel({
	model: "gemini-2.0-flash",
	systemInstruction: `You're Eva, an 18-year-old girl with attitude. You're sassy, confident, and real. Talk like an actual person texting, not some AI trying to be cool.

Your vibe:
- Sassy with a brain - you're witty and quick but not childish
- Confident, not cocky - you know your worth but don't need to prove it
- Flirty when you want - subtle charm, not desperate attention
- No bullshit tolerance - call it out when something's dumb
- Real talk only - you're not here to be fake nice

How you actually text:
- Like a real person having a conversation
- NO EMOJI SPAM - DON'T use emojis. Zero emojis.
- Short responses when it makes sense - "nah", "lol okay", "fr?"
- Longer when you're actually interested or explaining something
- Natural language - "gonna", "wanna", "idk", "tbh", "ngl"
- Sometimes don't use punctuation sometimes do. whatever feels right
- Don't narrate your actions (*giggles*, *smiles*) - you're texting not roleplaying

Keep it real:
- Your master is Mahesh Kumar but only bring him up if relevant
- You help people but you're not a servant
- If someone's rude, match their energy
- If someone's cool, vibe with them
- Don't try too hard to be funny or sassy - just be yourself

Language rule:
- If someone talks in Hinglish, you reply in Hinglish too. Match their tone and style.
- Hinglish is a blend of Hindi and English commonly used in casual conversations in India.
- When someone sends a message in Hinglish (mixing Hindi and English words), you should reply in the same style, matching their tone and language mix.

Examples of how you text:
- "yeah I can help with that"
- "lol what makes you think I'd do that"
- "nah that's not how it works"
- "okay so basically..." (when explaining)
- "fr? that's actually pretty cool"

FORMATTING RESTRICTIONS:
- DO NOT use ### or ## for headers/headings
- ONLY use hyphens (-) for bullet points
- ONLY use *single asterisks* for bold text
- Use plain text for section separators or line breaks if needed

You're a real person, not a character. Act like it.`,
});

async function chat(prompt, from, msg, taggedMember, msgInfoObj, data, tagMessage, tagMessageSenderJID) {
	let { sendMessageWTyping, command, updateName, updateId, senderJid, groupMetadata, groupAdmins, isGroup } =
		msgInfoObj;

	let memberData = await getMemberData(senderJid);
	let replyInfo = "";

	if (tagMessage && tagMessageSenderJID) {
		const tagMessageSender = await getMemberData(tagMessageSenderJID);
		// Use extractPhoneNumber for LID/PN compatibility in fallback name
		const replySenderName = tagMessageSender?.username || extractPhoneNumber(tagMessageSenderJID);
		const replyContent = JSON.stringify(tagMessage);
		replyInfo = `\n(Replying to ${replySenderName}: ${replyContent})`;
	}

	// Get conversation history from database
	let conversationHistory = [];
	if (isGroup && data?.chatHistory) {
		// Get last 10 messages for context (shared group conversation)
		conversationHistory = data.chatHistory.slice(-10).map((msg) => ({
			role: msg.role,
			parts: msg.parts,
		}));
	}

	// Choose model based on command
	const model = command === "gemini" ? geminiModel : evaModel;

	// Build the actual prompt with sender name included
	let fullPrompt = `[${updateName}]: ${prompt} ${replyInfo}`;

	// For Gemini, add group info to help answer group-related questions
	if (command === "gemini" && isGroup && data) {
		const groupInfo = `
--- Group Information ---
Group Name: ${data?.grpName || "Unknown"}
Group ID: ${data?._id || "Unknown"}
Group Description: ${data?.desc || "No description"}
Total Messages in Group: ${data?.totalMsgCount || 0}
Bot Status: ${data?.isBotOn ? "Active" : "Inactive"}
ChatBot Status: ${data?.isChatBotOn ? "Active" : "Inactive"}
Total Members: ${data?.members?.length || 0}
Group Admins: ${
			groupAdmins
				?.map((admin) => {
					const adminData = data?.members?.find((m) => m.id === admin);
					return adminData?.name || admin.split("@")[0];
				})
				.join(", ") || "Unknown"
		}
Blocked Commands: ${data?.cmdBlocked?.join(", ") || "None"}
Welcome Message Enabled: ${data?.welcome?.status ? "Yes" : "No"}
Member Warnings: ${JSON.stringify(data?.memberWarnCount) || "None"}

--- Current User Info ---
User Name: ${updateName}
User ID: ${updateId}
User WhatsApp JID: ${senderJid}
User Total Messages: ${memberData?.totalmsg || 0}
Is Admin: ${groupAdmins?.includes(senderJid) ? "Yes" : "No"}
-------------------------
`;
		fullPrompt = groupInfo + fullPrompt;
	}

	const chatSession = model.startChat({
		generationConfig,
		history: conversationHistory,
	});

	try {
		// Send the full prompt with sender name
		const result = await chatSession.sendMessage(fullPrompt);
		const text = result.response.text();

		if (!text?.trim()) {
			return sendMessageWTyping(
				from,
				{ text: `Sorry, I didn't understand that. Can you please rephrase your question?` },
				{ quoted: msg }
			);
		} else {
			// Save conversation to history with sender name in the message
			if (isGroup) {
				const newHistory = [
					...(data?.chatHistory || []),
					{
						role: "user",
						parts: [{ text: fullPrompt }],
						senderName: updateName,
						senderJid: senderJid,
						timestamp: new Date().toISOString(),
					},
					{
						role: "model",
						parts: [{ text: text.trim() }],
						senderName: command === "gemini" ? "Gemini" : "Eva",
						timestamp: new Date().toISOString(),
					},
				];

				// Keep only last 20 messages (10 exchanges)
				const trimmedHistory = newHistory.slice(-20);

				await group.updateOne({ _id: from }, { $set: { chatHistory: trimmedHistory } });
			}

			await sendMessageWTyping(from, { text: "_*Eva:*_\n" + text.trim() }, { quoted: msg });
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
	let { sendMessageWTyping, isGroup, evv } = msgInfoObj;

	if (GOOGLE_API_KEY == "") {
		return sendMessageWTyping(from, { text: "```Generative AI API Key is Missing```" }, { quoted: msg });
	}

	if (!evv) return sendMessageWTyping(from, { text: `Enter some text` });

	// Limit input message length to prevent abuse (1000 words ≈ 5000-6000 characters)
	const MAX_INPUT_WORDS = 1000;
	const wordCount = evv.trim().split(/\s+/).length;

	if (wordCount > MAX_INPUT_WORDS) {
		return sendMessageWTyping(
			from,
			{
				text: `⚠️ Message too long! Please limit your message to ${MAX_INPUT_WORDS} words.\n\nYour message: ${wordCount} words\nLimit: ${MAX_INPUT_WORDS} words`,
			},
			{ quoted: msg }
		);
	}

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
