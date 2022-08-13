const axiox = require('axios');
const jsdom = require("jsdom");
const { setCountDM, getCountDM } = require("../../DB/countDMDB");
const { JSDOM } = jsdom;
module.exports.command = () => {
    let cmd = ["redd", "reddit"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { isGroup, senderJid, sendMessageWTyping } = msgInfoObj;


    if (!args[0] || !(args[0].includes("reddit.com/r"))) return sendMessageWTyping(from, { text: "Provide the post link after command." }, { quoted: msg });
    console.log(args[0]);
    if (!isGroup) {
        await setCountDM(senderJid);
        if (getCountDM(senderJid) >= 100) {
            return sendMessageWTyping(from, { text: 'You have used your monthly limit.\nWait for next month.' }, { quoted: msg })
        }
        const getDmCount = await getCountDM(senderJid);
        sendMessageWTyping(from, { text: `*Limit Left* : ${getDmCount}/100` }, { quoted: msg });
    }
    await axiox('https://redditsave.com/info?url=' + args[0]).then((res) => {
        const dom = new JSDOM(res.data);
        const down = dom.window.document.getElementsByClassName("downloadbutton")[0].getAttribute("href");
        try {
            if (down.endsWith("png") || down.endsWith("jpg") || down.endsWith("jpeg")) {
                sendMessageWTyping(
                    from,
                    {
                        image: { url: down },
                    },
                    { quoted: msg }
                )
            } else if (down.endsWith("fallback")) {
                sendMessageWTyping(
                    from,
                    {
                        video: { url: down },
                    },
                    { quoted: msg }
                )
            } else {
                sendMessageWTyping(
                    from,
                    {
                        text: `Can't download gif for now wait for the update`
                    },
                    { quoted: msg }
                )
            }
        } catch {
            sendMessageWTyping(from, { text: "No Post Found" }, { quoted: msg });
        }
    }).catch((err) => {
        sendMessageWTyping(from, { text: "Error private / Not Found." }, { quoted: msg });
        console.log(err);
    })
}