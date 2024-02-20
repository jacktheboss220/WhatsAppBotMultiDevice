const fs = require("fs");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const SEARCH_ENGINE_KEY = process.env.SEARCH_ENGINE_KEY || "";
const axios = require("axios");

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const baseURL = "https://www.googleapis.com/customsearch/v1";
const googleapis = `?key=${GOOGLE_API_KEY}`;
const searchEngineKey = `&cx=${SEARCH_ENGINE_KEY}`;
const defQuery = "&q=";

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;

    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_KEY)
        return sendMessageWTyping(from,
            { text: "```Google API Key or Search Engine Key is Missing```" },
            { quoted: msg }
        );

    if (args[0]?.startsWith("@") && msg.message.extendedTextMessage) {
        return sendMessageWTyping(from, { text: "```Enter Word to Search```" }, { quoted: msg });
    }

    if (!args[0] && !msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: "```Enter Word to Search```" }, { quoted: msg });

    let search = evv || msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;

    const urlToSearch = `${baseURL}${googleapis}${searchEngineKey}${defQuery}${search}`;

    await axios(urlToSearch).then(async (res) => {
        const searchResults = res.data?.items;
        const extractedData = searchResults.map(result => {
            return {
                title: result.title,
                snippet: result.snippet,
                link: result.link,
            };
        });

        let message = "";
        for (let i = 0; i < extractedData.length; i++) {
            const result = extractedData[i];
            message += `*Title*: ${result.title}\n*Snippet*: ${result.snippet}\n*Link*: ${result.link} \n\n`;

            // if (i === 0) {
            //     message += readMore + "\n";
            // }
        }
        if (message) {
            sendMessageWTyping(from, { text: message }, { quoted: msg });
        } else {
            sendMessageWTyping(from, { text: "```No Results Found```" }, { quoted: msg });
        }
    }).catch(() => {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    });
};

module.exports.command = () => ({ cmd: ["search", "gs"], handler });
