const axios = require("axios");
const { getBotData } = require('../../mongo-DB/botDataDb');

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, ownerSend, ig } = msgInfoObj;
    if (!args[0] || args[0].includes("http")) return sendMessageWTyping(from, { text: `*Provide Username*` }, { quoted: msg })
    let prof = args[0];
    const botData = await getBotData();

    if (botData.instaSession_id) {
        const text = botData.instaSession_id;
        const sessionid = /sessionid=([^;]+);/.exec(text)[1];
        const ds_user_id = /ds_user_id=([^;]+);/.exec(text)[1];

        await axios({
            url: `https://www.instagram.com/${prof}/?__a=1&__d=dis`,
            headers: {
                accept: "*/*",
                "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
                "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="102", "Google Chrome";v="102"',
                "sec-ch-ua-mobile": "?0",
                'sec-ch-ua-platform': '"Linux"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                'x-asbd-id': '198387',
                'x-csrftoken': '9id7NIrYulj8aPVUSAOLvNC2nkhRRWdd',
                'x-ig-app-id': '936619743392459',
                'x-ig-www-claim': 'hmac.AR2rCmfN1Jb98fTtIV5rXy1EHz-DxQIGk6fgEQbmFdZp0uiw',
                cookie: `sessionid=${sessionid}; ig_nrcb=1; fbm_124024574287414=base_domain=.instagram.com; ds_user_id=${ds_user_id}; dpr=1.5;`,
                Referer: 'https://www.instagram.com/',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
            },
            method: "GET",
        }).then(res => {
            if (res?.data?.graphql?.user?.profile_pic_url_hd) {
                sendMessageWTyping(from,
                    {
                        image: { url: res.data.graphql.user.profile_pic_url_hd },
                        caption: `Sent by eva`
                    },
                    { quoted: msg }
                )
            } else {
                sendMessageWTyping(from, { text: `*No Profile Picture Found*` }, { quoted: msg })
            }
        }).catch(async (err) => {
            //     await ig.fetchUser(prof).then(async (res) => {
            //         await sendMessageWTyping(from,
            //             {
            //                 image: { url: res.hd_profile_pic_url_info.url },
            //                 caption: `Sent by eva`
            //             },
            //             { quoted: msg }
            //         )
            //         ownerSend(JSON.stringify(res, "", 2, 100));
            //     }).catch((err) => {
            //         console.log("Error", err);
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            //     });
        });
    } else {
        sendMessageWTyping(from, { text: `*No Key is Set*` }, { quoted: msg })
    }
}

module.exports.command = () => ({
    cmd: ["idp", "dp"],
    desc: "Get Instagram Profile Picture",
    usage: "idp | dp <username>",
    handler
});