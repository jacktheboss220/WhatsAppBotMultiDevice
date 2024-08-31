const axios = require('axios');

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    if (!args[0]) return sendMessageWTyping(from, { text: `*Enter the word the search*` }, { quoted: msg });

    try {
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${args[0]}`);
        const dice = response.data[0];
        console.log(dice.word);
        sendMessageWTyping(from, {
            text: `*Term*:- ${dice.word}
*Pronounciation*:- ${dice.phonetic}
*Meaning*: ${dice.meanings[0].definitions[0].definition}
*Example*: ${dice.meanings[0].definitions[0].example}`
        }, { quoted: msg });
    } catch (err) {
        console.log(err);
        return sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
};

module.exports.command = () => ({
    cmd: ["dictionary", "dict"],
    desc: "Get meaning of a word",
    usage: "dict <word>",
    handler
});
