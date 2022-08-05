module.exports.command = () => {
    let cmd = ["removebot", "leave"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    return sendMessageWTyping(from, { text: `Some error Occurred. Remove bot manually` });
    const { reply } = msgInfoObj;
    try {
        await sock.groupLeave(from);
    } catch (err) {
        console.log('Error');
    }
}