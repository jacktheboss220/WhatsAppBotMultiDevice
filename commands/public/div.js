module.exports.command = () => {
    let cmd = ["dev", "source"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgTnfoObj) => {
    const { sendMessageWTyping } = msgTnfoObj;
    const templateButtons = [
        { index: 1, urlButton: { displayText: 'Project Link!', url: 'https://github.com/jacktheboss220/WhatsAppBotMultiDevice' } },
        { index: 2, urlButton: { displayText: 'Telegram!', url: 'https://t.me/jackthebosss' } },
        { index: 3, urlButton: { displayText: 'Follow me!', url: 'https://github.com/jacktheboss220' } },
    ]
    const templateMessage = {
        text: `π΅πππππ  ππ ππ πΆπππππ ππ π’ππ ππππ ππ’ π πππ.\n\nπ΅ππππ π πππ ππ πππππ, πππππππ ππ ππ ππππππππ.\n`,
        footer: 'ππππππππππππΈπΈπΆ',
        viewOnce: true,
        templateButtons: templateButtons
    }
    sendMessageWTyping(from, templateMessage);
    // sendMessageWTyping(from, { text: 'https://github.com/jacktheboss220/WhatsAppBotMultiDevice' }, { quoted: msg });
}