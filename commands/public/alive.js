module.exports.command = () => {
    let cmd = ["alive", "a"];
    return { cmd, handler };
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    sendMessageWTyping(
        from,
        { text: "```🫠🅈🄴🅂 🄸'🄼 🄰🄻🄸🅅🄴🫠```" },
        { quoted: msg }
    );
};