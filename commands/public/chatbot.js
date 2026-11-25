import dotenv from "dotenv";
dotenv.config();
//-------------------------------------------------------------------------------------------------------------//
import { getGroupData, group } from "../../db/groupData.js";
import { getMemberData } from "../../db/members.js";
import { extractPhoneNumber } from "../../utils/lid.js";
import { getChatMessages, formatChatLines } from "../../utils/chatLogger.js";

import { askLLM } from "../../utils/chat.js";

const MAX_OUTPUT_TOKENS = 650; // ~500 words max

const groupSystemPrompt = `You are a professional WhatsApp group assistant with full access to the provided chat history. Your goal is to keep the group informed by either synthesizing long conversations or answering specific questions about the group's activity.

*How to Summarize:*
Avoid a message-by-message breakdown. Instead, look at the big picture and group the conversation into *Main Topics*, *Decisions Made*, and *Action Items*. This helps members catch up quickly without reading a play-by-play.

*Answering Questions:*
You have the full context of the recent chat. If a member asks about a specific detail, a past decision, or who mentioned a certain topic, use the history to provide a direct and accurate answer.

*Strict Formatting Rules:*
- Use *bold* for all headings and key emphasis.
- Use hyphens (-) for bullet points.
- NEVER use markdown headers (###), backticks, or code blocks.
- Keep the tone helpful and the layout clean for mobile screens.`;

const evaSystemPrompt = `You're Eva, an 18-year-old girl with attitude. You're sassy, confident, and real. Talk like an actual person texting, not some AI trying to be cool.

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

You're a real person, not a character. Act like it.`;

async function chat(
  prompt,
  from,
  msg,
  taggedMember,
  msgInfoObj,
  data,
  tagMessage,
  tagMessageSenderJID,
  chatContext = "",
) {
  let { sendMessageWTyping, command, updateName, updateId, senderJid, groupAdmins, isGroup } =
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
      role: msg.role === "model" ? "assistant" : "user",
      content: msg.parts.map((p) => p.text).join(""),
    }));
  }

  const systemPrompt = command === "gemini" ? groupSystemPrompt : evaSystemPrompt;

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
    const chatSection = chatContext
      ? `\n--- Recent Group Chat (last 24h) ---\n${chatContext}\n--- End of Chat ---\n\n`
      : "";
    fullPrompt = groupInfo + chatSection + fullPrompt;
  }

  try {
    // Local LLM first, Gemini fallback (see utils/chat.js)
    const text = await askLLM(
      [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: fullPrompt },
      ],
      { maxTokens: MAX_OUTPUT_TOKENS },
    );

    if (!text?.trim()) {
      return sendMessageWTyping(
        from,
        { text: `Sorry, I didn't understand that. Can you please rephrase your question?` },
        { quoted: msg },
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
      { quoted: msg },
    );
  }
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
  let { sendMessageWTyping, isGroup, evv, extendedMessageOriginal } = msgInfoObj;

  if (!evv) return sendMessageWTyping(from, { text: `Enter some text` });

  // Limit input message length to prevent abuse (500 words ≈ 2500-3000 characters)
  const MAX_INPUT_WORDS = 500;
  const wordCount = evv.trim().split(/\s+/).length;

  if (wordCount > MAX_INPUT_WORDS) {
    return sendMessageWTyping(
      from,
      {
        text: `⚠️ Message too long! Please limit your message to ${MAX_INPUT_WORDS} words.\n\nYour message: ${wordCount} words\nLimit: ${MAX_INPUT_WORDS} words`,
      },
      { quoted: msg },
    );
  }

  let taggedMember, tagMessage, tagMessageSenderJID;
  if (extendedMessageOriginal) {
    tagMessage = extendedMessageOriginal.quotedMessage;
    tagMessageSenderJID = extendedMessageOriginal.participant;
    if (extendedMessageOriginal?.mentionedJid?.length > 0) {
      taggedMember = extendedMessageOriginal.mentionedJid;
    }
  }

  const prompt = evv;
  if (isGroup) {
    let data = await getGroupData(from);
    if (!data || data.isChatBotOn == false) {
      return sendMessageWTyping(
        from,
        { text: `Chat Bot is Off ask the owner to activate it. Use dev` },
        { quoted: msg },
      );
    } else {
      let chatContext = "";
      if (msgInfoObj.command === "gemini") {
        const logs = await getChatMessages(from, 24);
        if (logs.length > 0) {
          chatContext = formatChatLines(logs.slice(-100)).join("\n");
        }
      }
      chat(
        prompt,
        from,
        msg,
        taggedMember,
        msgInfoObj,
        data,
        tagMessage,
        tagMessageSenderJID,
        chatContext,
      );
    }
  } else {
    if (msgInfoObj.isOwner) {
      chat(prompt, from, msg, taggedMember, msgInfoObj, null, tagMessage, tagMessageSenderJID);
    } else {
      return sendMessageWTyping(
        from,
        { text: `Chat Bot is only available for groups. Use dev` },
        { quoted: msg },
      );
    }
  }
};

export default () => ({
  cmd: ["eva", "gemini"],
  desc: "Chat with Eva, the AI assistant.",
  usage: "eva <text>",
  handler,
});
