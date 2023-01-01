require('dotenv').config()
const { group } = require('../../mongo-DB/groupDataDb')
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
module.exports.command = () => {
    let cmd = ["eva"];
    return { cmd, handler };
}
async function chat(prompt, from, msg, sendMessageWTyping) {
    await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 2048,
        temperature: 0.5,
    }).then(response => {
        const text = response.data.choices[0].text;
        sendMessageWTyping(from, { text: text.trim() }, { quoted: msg });
    }).catch(err => {
        console.log(err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    });
}
const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { evv, sendMessageWTyping, isGroup } = msgInfoObj;
    if (!args[0]) return sendMessageWTyping(from, { text: `Enter some text` });
    let message = encodeURI(evv);
    const prompt = message;
    if (isGroup) {
        group.findOne({ _id: from }).then(res => {
            if (res.isChatBotOn == false) {
                return sendMessageWTyping(from, { text: `Chat Bot is Off ask the owner to activate it. Use dev` }, { quoted: msg });
            } else {
                chat(prompt, from, msg, sendMessageWTyping);
            }
        });
    } else {
        chat(prompt, from, msg, sendMessageWTyping)
    }
}
