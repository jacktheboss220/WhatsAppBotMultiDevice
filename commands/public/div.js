module.exports.command = () => {
    let cmd = ["dev", "source"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgTnfoObj) => {
    const { sendMessageWTyping } = msgTnfoObj;
    // const templateButtons = [
    //     { index: 1, urlButton: { displayText: 'WhatsApp!', url: 'https://wa.me/919506756846' } },
    //     { index: 2, urlButton: { displayText: 'Telegram!', url: 'https://t.me/UL7R0N' } },
    //     { index: 3, urlButton: { displayText: 'Follow me!', url: 'https://www.instagram.com/imsad1q' } },
    // ]
    // const templateMessage = {
    //     text: `𝙵𝚘𝚕𝚕𝚘𝚠 𝚖𝚎 𝚘𝚗 𝙶𝚒𝚝𝚑𝚞𝚋 𝚒𝚏 𝚢𝚘𝚞 𝚕𝚒𝚔𝚎 𝚖𝚢 𝚠𝚘𝚛𝚔.\n\n𝙵𝚘𝚞𝚗𝚍 𝚊 𝚋𝚞𝚐 𝚘𝚛 𝚎𝚛𝚛𝚘𝚛, 𝚌𝚘𝚗𝚝𝚊𝚌𝚝 𝚖𝚎 𝚘𝚗 𝚝𝚎𝚕𝚎𝚐𝚛𝚊𝚖.\n`,
    //     footer: '𝚓𝚊𝚌𝚔𝚝𝚑𝚎𝚋𝚘𝚜𝚜𝟸𝟸𝟶',
    //     viewOnce: true,
    //     templateButtons: templateButtons
    // }
    // sendMessageWTyping(from, templateMessage);
    sendMessageWTyping(
        from,
        {
            text: `WhatsApp: https://wa.me/919506756846\n\nTelegram: https://t.me/UL7R0N\n\nFollow me: https://www.instagram.com/imsad1q`
        },
        { quoted: msg }
    );
}
