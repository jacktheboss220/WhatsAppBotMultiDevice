module.exports.command = () => {
    let cmd = ["test"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    if (args.length === 0) {
        return sendMessageWTyping(from, { text: `❌ empty query!` }, { quoted: msg });
    }
    try {
        let resultTest = eval(args[0]);
        if (typeof resultTest === "object")
            sendMessageWTyping(from, { text: JSON.stringify(resultTest) }, { quoted: msg });
        else sendMessageWTyping(from, { text: resultTest.toString() }, { quoted: msg });
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}