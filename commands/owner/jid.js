module.exports.command = () => {
    let cmd = ["jid", "grpid"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    sendMessageWTyping(
        from,
        { text: from },
        { quoted: msg }
    );
}