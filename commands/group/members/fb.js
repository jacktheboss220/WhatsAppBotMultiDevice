const axios = require('axios');
const { Facebook } = require('../../../social-downloader-sdk');

module.exports.command = () => {
    let cmd = ["fb", "facebook"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;

    if (!args[0] || !args[0].includes("http")) return sendMessageWTyping(from, { text: `Enter Url after fb` }, { quoted: msg });

    let FBurl;
    await axios(args[0]).then((response) => {
        FBurl = response.request._redirectable._currentUrl
    }).then(async () => {
        const res = await Facebook.getVideo(`${FBurl}`);
        if (res.data.hasError == false) {
            if (res.data.body.videoHD) {
                sendMessageWTyping(
                    from,
                    {
                        video: { url: res.data.body.videoHD },
                        caption: 'Send by myBitBot'
                    },
                    { quoted: msg }
                )
            } else {
                sendMessageWTyping(
                    from,
                    {
                        video: { url: res.data.body.video },
                        caption: 'Send by myBitBot'
                    },
                    { quoted: msg }
                )
            }
        } else if (res.data.hasError == true) {
            sendMessageWTyping(from, { text: res.data.errorMessage }, { quoted: msg })
        }
    }).catch((err) => {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    });
}
