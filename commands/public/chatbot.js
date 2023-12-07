require('dotenv').config()
const { getGroupData } = require('../../mongo-DB/groupDataDb')

const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function chat(prompt, from, msg, tag, sendMessageWTyping) {
    await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: 'user', content: prompt, }],
        // max_tokens: 4096,
        // max_tokens: 30,
        temperature: 0.3,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    }).then(response => {
        let text = response.choices[0].message.content;
        try {
            text = decodeURI(text);
        } catch (err) {
            console.log(err);
            text = text.replace(/%20/g, ' ');
        }
        // text = text.replace(/(\r\n|\n|\r)/gm, "");
        sendMessageWTyping(from, { text: text.trim(), mentions: [tag] }, { quoted: msg });
    }).catch(err => {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    });
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { evv, sendMessageWTyping, isGroup } = msgInfoObj;
    if (!args[0]) return sendMessageWTyping(from, { text: `Enter some text` });
    let tag;
    if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        tag = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    let message = encodeURI(evv);
    const prompt = message;
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

module.exports.command = () => ({ cmd: ["eva", "gpt"], handler });