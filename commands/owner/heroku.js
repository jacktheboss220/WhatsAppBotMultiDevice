require('dotenv').config();

const Heroku = require('heroku-client');
const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN });

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, command } = msgInfoObj;

    if (command === "restart") {
        sendMessageWTyping(from, {
            text: "Dyno restarted"
        }, { quoted: msg });
        heroku.delete(`/apps/${process.env.HEROKU_APP_NAME}/dynos/`).then((dynos) => {
        }).catch((err) => {
            sendMessageWTyping(from, {
                text: "Error restarting dyno" + err.toString()
            }, { quoted: msg });
        });
    }
}

module.exports.command = () => ({ cmd: ["heroku", "restart"], handler });