const axios = require('axios');

module.exports.command = () => {
    let cmd = ["joke"];
    return { cmd, handler };
}


const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    let take = args[0] ? args[0].slice(0, 1).toUpperCase() + args[0].slice(1) : "Any";
    const baseURL = "https://v2.jokeapi.dev";
    const categories = (!take) ? "Any" : take;
    const cate = [
        "Programming",
        "Misc",
        "Dark",
        "Pun",
        "Spooky",
        "Chrimstmas"
    ];
    if (categories != "Any" && !(cate.includes(take))) return sendMessageWTyping(from, { text: `*Wrong Categories*\n *_Type any one_* :  *${cate}*` }, { quoted: msg });
    // const params = "blacklistFlags=religious,racist";
    try {
        axios.get(`${baseURL}/joke/${categories}`).then((res) => {
            let randomJoke = res.data;
            if (randomJoke.type == "single") {
                mess = 'Category => ' + randomJoke.category + '\n\n' + randomJoke.joke;
                sendMessageWTyping(from, { text: mess }, { quoted: msg });
            }
            else {
                mess = 'Category => ' + randomJoke.category + '\n\n' + randomJoke.setup + '\n' + randomJoke.delivery;
                sendMessageWTyping(from, { text: mess }, { quoted: msg });
            }
            console.log("Categories => ", categories);;
        }).catch((err) => {
            console.log("error : ", err);
            sendMessageWTyping(from, { text: `Error` }, { quoted: msg });

        });
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    }
}