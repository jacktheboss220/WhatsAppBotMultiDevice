const ud = require('urban-dictionary');

module.exports.command = () => {
    let cmd = ["ud", "name"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    if (!args[0]) return sendMessageWTyping(from, { text: `*Provide any word to search*` }, { quoted: msg });
    try {
        let result = await ud.define(args[0])
        let term = result[0].word;
        let def = result[0].definition;
        let example = result[0].example;
        sendMessageWTyping(
            from,
            {
                text: `*Term*: ${term} 
*Definition*: ${def}
*Example*: ${example}`
            },
            { quoted: msg });
    }
    catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}