const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;
    //return sendMessageWTyping(from, { text: "This command is currently disabled." }, { quoted: msg });
    if (!args[0]) return sendMessageWTyping(from, { text: "Please provide a prompt to generate an image from." }, { quoted: msg });
    await openai.images.generate({
        prompt: evv,
        n: 1,
        size: "1024x1024",
    }).then(result => {
        if (!result) return sendMessageWTyping(from, { text: "Something went wrong." }, { quoted: msg });
        else {
            sendMessageWTyping(from, { image: { url: result.data.data[0].url } }, { quoted: msg });
        }
    }).catch(err => {
        console.log(err);
        return sendMessageWTyping(from, { text: "Something went wrong." }, { quoted: msg });
    });
}


module.exports.command = () => ({ cmd: ["make", "gen"], handler });
