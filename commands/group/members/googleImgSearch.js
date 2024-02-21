require("dotenv").config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const SEARCH_ENGINE_KEY = process.env.SEARCH_ENGINE_KEY || "";
const fs = require("fs");
const axios = require("axios");
const { googleImage } = require('@bochilteam/scraper')
const { getGroupData } = require("../../../mongo-DB/groupDataDb");

const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;

const baseURL = "https://www.googleapis.com/customsearch/v1";
const googleapis = `?key=${GOOGLE_API_KEY}`;
const searchEngineKey = `&cx=${SEARCH_ENGINE_KEY}`;
const searchType = "&searchType=image";
const defQuery = "&q=";

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;

    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_KEY)
        return sendMessageWTyping(from,
            { text: "```Google API Key or Search Engine Key is Missing```" },
            { quoted: msg }
        );

    const data = await getGroupData(from);

    if (!data.isImgOn) {
        return sendMessageWTyping(from, { text: "```By Default Search Image is Disable in this group.```" }, { quoted: msg });
    }

    if (args[0]?.startsWith("@") && msg.message.extendedTextMessage) {
        return sendMessageWTyping(from, { text: "```Enter Word to Search```" }, { quoted: msg });
    }

    const urlToSearch = `${baseURL}${googleapis}${searchEngineKey}${searchType}${defQuery}${evv}`;
    await axios(urlToSearch).then(async (res) => {
        const links = res?.data?.items?.map((ele) => ele.link);
        sendImage(links, from, msg, { args, sendMessageWTyping });
    }).catch(() => {
        googleImage(evv).then(async (res) => {
            sendImage(res, from, msg, { args, sendMessageWTyping });
        }).catch((err) => {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        });
    });
};

const sendImage = async (links, from, msg, { args, sendMessageWTyping }) => {
    const imageUrl = getRandom(".png");
    if (!links?.length) {
        return sendMessageWTyping(from, { text: "No image found" }, { quoted: msg });
    }
    let random = 0;
    if (args[0] == '1') {
        random = 0;
    } else if (links.length > 5) {
        random = Math.floor(Math.random() * 5);
    }
    const url = links[random];
    try {
        await downloadImage(url, imageUrl);
        await sendMessageWTyping(from, { image: fs.readFileSync(imageUrl) }, { quoted: msg });
        fs.unlinkSync(imageUrl);
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}

const downloadImage = async (url, imageUrl) => {
    const response = await axios({
        method: "get",
        url,
        responseType: "stream",
    });
    const out = response.data.pipe(fs.createWriteStream(imageUrl));
    return new Promise((resolve, reject) => {
        out.on("finish", resolve).on("error", reject);
    });
};

module.exports.command = () => ({ cmd: ["img"], handler });
