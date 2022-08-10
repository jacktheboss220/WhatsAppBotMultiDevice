const ud = require('urban-dictionary');
const axios = require('axios');

module.exports.command = () => {
    let cmd = ["dic", "meaning"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    if (!args[0]) return sendMessageWTyping(from, { text: `*Enter the word the search*` }, { quoted: msg });
    await axios({
        method: `GET`,
        url: `https://api.dictionaryapi.dev/api/v2/entries/en/${args[0]}`
    }).then((res) => {
        dice = res.data[0];
        console.log(dice.word);
        sendMessageWTyping(
            from,
            {
                text: `*Term*:- ${dice.word}
*Pronounciation*:- ${dice.phonetic}
*Meaning*: ${dice.meanings[0].definitions[0].definition}
*Example*: ${dice.meanings[0].definitions[0].example}`
            },
            { quoted: msg }
        )
    }).catch((err) => {
        console.log(err);
        return sendMessageWTyping(from, { text: `*Sorry no word found*` }, { quoted: msg });
    });
}