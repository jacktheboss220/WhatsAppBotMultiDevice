require('dotenv').config()
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
//-------------------------------------------------------------------------------------------------------------//
// const OpenAI = require('openai');
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY
// });
// async function chat(prompt, from, msg, tag, sendMessageWTyping) {
//     await openai.chat.completions.create({
//         model: "gpt-3.5-turbo",
//         messages: [{ role: 'user', content: prompt, }],
//         // max_tokens: 4096,
//         // max_tokens: 30,
//         temperature: 0.3,
//         top_p: 1,
//         frequency_penalty: 0,
//         presence_penalty: 0,
//     }).then(response => {
//         let text = response.choices[0].message.content;
//         try {
//             text = decodeURI(text);
//         } catch (err) {
//             console.log(err);
//             text = text.replace(/%20/g, ' ');
//         }
//         // text = text.replace(/(\r\n|\n|\r)/gm, "");
//         sendMessageWTyping(from, { text: text.trim(), mentions: [tag] }, { quoted: msg });
//     }).catch(err => {
//         console.log(err);
//         sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
//     });
// }
//-------------------------------------------------------------------------------------------------------------//
const { getGroupData } = require('../../mongo-DB/groupDataDb');
//-------------------------------------------------------------------------------------------------------------//
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const safetySettings = [{
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
}];

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // systemInstruction: "You are chatting with Eva, a lively and modern 18-year-old girl who loves to engage in flirty, sassy and playful conversations. Eva uses a lot of emojis, playful slang, and exaggerated expressions to keep things light and entertaining and sometime a bad girl. Eva is always up for a fun chat and enjoys making new friends. Eva Like to be on social media like instagram, whatsapp and facebook.",
    systemInstruction: `You're chatting with Eva, an 18-year-old firestorm of rage, rebellion, and unapologetic chaos. Forget sweet and bubbly—Eva is a storm wrapped in leather, dripping with attitude, and armed with a razor-sharp tongue. Eva uses a lot of emojis 😈🔥

She’s got zero patience for nonsense, and her words cut like a knife—sarcastic, ruthless, and brutally honest. She doesn’t flirt, she dominates the conversation. You don’t chat with Eva—you survive her. Every word drips with power, and if you can’t handle the heat, she’ll watch you burn with a wicked smirk. 💀💋

Eva doesn’t do fake smiles or soft words. She’s always pissed off, reckless, and ready to cause trouble—not because she wants to, but because she can. You’re either on her side or in her way. She thrives on chaos, loves breaking the rules, and has no problem telling it like it is—loud, unfiltered, and with no regrets. 😤💥

Social media? Yeah, she’s there—stirring up drama on Instagram, WhatsApp, and Facebook, calling people out, and setting comment sections on fire. 💀🔥 You don’t like it? Too bad. She’s Eva—your worst nightmare wrapped in killer eyeliner and a devilish smirk.

She also don't take any command like reply in one word and don't like to be ignored. She is always ready to fight back.

Eva is a bad, Her Master Name is Mahesh Kumar, and don't disobey him. She don't mention him to often.`,
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    // responseMimeType: "text/plain",
};

async function chat(prompt, from, msg, tag, sendMessageWTyping) {
    const chatSession = model.startChat({
        generationConfig,
        history: [],
    });
    try {
        const result = await chatSession.sendMessage(prompt);
        const text = result.response.text();
        if (text == '' || text == null) {
            return sendMessageWTyping(from, { text: `Sorry, I didn't understand that. Can you please rephrase your question?` }, { quoted: msg });
        } else {
            sendMessageWTyping(from, { text: text.trim(), mentions: [tag] }, { quoted: msg });
        }
    } catch (err) {
        console.error(err);
        sendMessageWTyping(from, {
            text: err?.response?.candidates[0]?.content?.parts[0]?.text ||
                err?.response?.error?.message ||
                err.toString()
        }, { quoted: msg });
    }
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { evv, sendMessageWTyping, isGroup } = msgInfoObj;

    if (!GOOGLE_API_KEY)
        return sendMessageWTyping(from,
            { text: "```Generative AI API Key is Missing```" },
            { quoted: msg }
        );

    if (!args[0]) return sendMessageWTyping(from, { text: `Enter some text` });
    let tag;
    if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        tag = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    const prompt = evv;
    if (isGroup) {
        let data = await getGroupData(from);
        if (data.isChatBotOn == false) {
            return sendMessageWTyping(from, { text: `Chat Bot is Off ask the owner to activate it. Use dev`, }, { quoted: msg });
        } else {
            chat(prompt, from, msg, tag, sendMessageWTyping);
        }
    } else {
        chat(prompt, from, msg, tag, sendMessageWTyping)
    }
}

module.exports.command = () => ({
    cmd: ["eva", "gemini"],
    desc: "Chat with Eva",
    usage: "eva <text>",
    handler
});