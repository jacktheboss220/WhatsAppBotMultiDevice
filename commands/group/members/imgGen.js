const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;
    // return sendMessageWTyping(from, { text: "This command is currently disabled." }, { quoted: msg });
    if (!args[0]) return sendMessageWTyping(from, { text: "Please provide a prompt to generate an image from." }, { quoted: msg });
    const result = await openai.createImage({
        prompt: evv,
        n: 1,
        size: "1024x1024",
    });

    if (!result) return sendMessageWTyping(from, { text: "Something went wrong." }, { quoted: msg });
    else {
        sendMessageWTyping(from, { image: { url: result.data.data[0].url } }, { quoted: msg });
    }
}


module.exports.command = () => ({ cmd: ["make", "gen"], handler });