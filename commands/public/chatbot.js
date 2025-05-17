require("dotenv").config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
//-------------------------------------------------------------------------------------------------------------//
const { getGroupData } = require("../../mongo-DB/groupDataDb");
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
	// responseMimeType: "text/plain",
};

async function chat(prompt, from, msg, taggedMember, msgInfoObj, data, tagMessage, tagMessageSender) {
	let { sendMessageWTyping, command, updateName, updateId } = msgInfoObj;

	if (command == "gemini") {
		model = genAI.getGenerativeModel({
			model: "gemini-2.0-flash",
			systemInstruction: `
			Current Message Sent by: ${updateName} (${updateId})\n
            Content in current message: ${JSON.stringify(msgInfoObj.content)},
            Complete Message sent by sender: ${JSON.stringify(msgInfoObj.evv)},
            Command Used: ${JSON.stringify(msgInfoObj.command)},
            Is this group or DM: ${JSON.stringify(msgInfoObj.isGroup)},
            Command Used by: ${JSON.stringify(msgInfoObj.senderJid)},
            Group Metadata by Whatsapp: ${JSON.stringify(msgInfoObj.groupMetadata)},
            Admins for this group: ${JSON.stringify(msgInfoObj.groupAdmins)},
            ID for the group: ${JSON.stringify(data._id)},
            Group Name: ${JSON.stringify(data.grpName)},
            Group Description: ${JSON.stringify(data.desc)},
            Commands Blocked for this group: ${JSON.stringify(data.cmdBlocked)},
            Welcome: ${JSON.stringify(data.welcome)},
            Total Message Count: ${JSON.stringify(data.totalMsgCount)},
            Member Warn Count: ${JSON.stringify(data.memberWarnCount)},
            Members: ${JSON.stringify(data.members)},
            How to response: IN WHATSAPP FORMAT ONLY
            `,
		});
	}

	const chatSession = model.startChat({
		generationConfig,
		history: tagMessage
			? [
					{
						role: "user",
						content: `
						Current Message Sent by: ${updateName} (${updateId})\n
						Previous Message Sent by: ${tagMessageSender} \n
						Person Tagged in Previous Message : ${taggedMember} \n
						Previous Message: ${JSON.stringify(tagMessage)},
						`,
					},
			  ]
			: [],
	});

	try {
		const result = await chatSession.sendMessage(prompt);
		const text = result.response.text();
		if (text == "" || text == null) {
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
				text:
					err?.response?.candidates[0]?.content?.parts[0]?.text ||
					err?.response?.error?.message ||
					err.toString(),
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

	let taggedMember, tagMessage, tagMessageSender;
	if (msg.message.extendedTextMessage) {
		tagMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
		tagMessageSender = msg.message.extendedTextMessage.contextInfo.participant;
		if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
			taggedMember = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
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
			chat(prompt, from, msg, taggedMember, msgInfoObj, data, tagMessage, tagMessageSender);
		}
	} else {
		chat(prompt, from, msg, taggedMember, msgInfoObj, {}, tagMessage, tagMessageSender);
	}
};

module.exports.command = () => ({
	cmd: ["eva", "gemini"],
	desc: "Chat with Eva",
	usage: "eva <text>",
	handler,
});
