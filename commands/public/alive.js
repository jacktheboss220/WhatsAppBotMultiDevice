module.exports.command = () => {
    let cmd = ["alive", "a"];
    return { cmd, handler };
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    sendMessageWTyping(
        from,
        { text: "```π« ππ΄π πΈ'πΌ π°π»πΈππ΄π« ```" },
        { quoted: msg }
    );
};