const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    sendMessageWTyping(
        from,
        { text: from },
        { quoted: msg }
    );
}

export default () => ({
    cmd: ['jid'],
    desc: 'Get your jid',
    usage: 'jid',
    handler
});