const handler = async (sock, msg, from, args, msgTnfoObj) => {
    const { sendMessageWTyping } = msgTnfoObj;
    // const templateButtons = [
    //     { index: 1, urlButton: { displayText: 'Project Link!', url: 'https://github.com/Dashu0/dashu' } },
    //     { index: 2, urlButton: { displayText: 'Telegram!', url: 'http://T.me/Dasshuuuu' } },
    //     { index: 3, urlButton: { displayText: 'Follow me!', url: 'https://github.com/Dashu0' } },
    // ]
    // const templateMessage = {
    //     text: `𝙵𝚘𝚕𝚕𝚘𝚠 𝚖𝚎 𝚘𝚗 𝙶𝚒𝚝𝚑𝚞𝚋 𝚒𝚏 𝚢𝚘𝚞 𝚕𝚒𝚔𝚎 𝚖𝚢 𝚠𝚘𝚛𝚔.\n\n𝙵𝚘𝚞𝚗𝚍 𝚊 𝚋𝚞𝚐 𝚘𝚛 𝚎𝚛𝚛𝚘𝚛, 𝚌𝚘𝚗𝚝𝚊𝚌𝚝 𝚖𝚎 𝚘𝚗 𝚝𝚎𝚕𝚎𝚐𝚛𝚊𝚖.\n`,
	@@ -20,8 +20,8 @@ const handler = async (sock, msg, from, args, msgTnfoObj) => {
    sendMessageWTyping(
        from,
        {
            text: `Github: https://github.com/Dashu0/dashu\n\nTelegram: https://t.me/Dasshuuuu\n\nFollow me: https://github.com/Dashu0`
        },
        { quoted: msg }
    );
}
