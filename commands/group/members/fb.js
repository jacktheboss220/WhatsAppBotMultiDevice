const axios = require('axios');
const { Facebook } = require('../../../social-downloader-sdk');

module.exports.command = () => {
    let cmd = ["fb", "facebook"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;

    if (!args[0] || !args[0].startswith("http")) return sendMessageWTyping(`Enter Url after fb`);

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
            sendMessageWTyping(res.data.errorMessage)
        }
    }).catch((err) => {
        console.log(err);
    });
}