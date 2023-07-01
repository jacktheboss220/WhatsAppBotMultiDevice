
module.exports.command = () => {
    let cmd = ["idp", "dp"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, OwnerSend, ig } = msgInfoObj;
    if (!args[0] || args[0].includes("http")) return sendMessageWTyping(from, { text: `*Provide Username*` }, { quoted: msg })
    let prof = args[0];
    await ig.fetchUser(prof).then(async (res) => {
        await sendMessageWTyping(
            from,
            {
                image: { url: res.hd_profile_pic_url_info.url },
                caption: `Send by eva`
            },
            { quoted: msg }
        )
        OwnerSend(JSON.stringify(res, "", 2, 100));
    }).catch((err) => {
        console.log("Error", err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    });
}
