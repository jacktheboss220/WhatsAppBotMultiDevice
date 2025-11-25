import axios from 'axios';

const getGender = async (name) => {
    let url = "https://api.genderize.io/?name=" + name;
    let { data } = await axios.get(url);
    let genderText = `${data.name} is ${data.gender} with ${data.probability} probability`;
    return new Promise((resolve, reject) => {
        if (genderText != '')
            resolve(genderText);
        else
            reject("Name Not Found!!!");
    });
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping } = msgInfoObj;

    if (args.length == 0) return sendMessageWTyping(from, { text: `❌ Name is not given! \nSend ${prefix}gender first_name` }, { quoted: msg });

    if (args[0].includes("@")) return sendMessageWTyping(from, { text: `❌ Don't tag! \nSend ${prefix}gender first_name` }, { quoted: msg });

    getGender(args[0]).then((message) => {
        sendMessageWTyping(from, { text: message }, { quoted: msg });
    }).catch((error) => {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(error);
    });
}

export default () => ({
    cmd: ['gender'],
    desc: 'get gender of a name',
    usage: 'gender <name> | reply to a message.',
    handler
});
