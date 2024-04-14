const handler = async (sock, msg, from, args, msgInfoObj) => {
    const start = process.hrtime();
    const { sendMessageWTyping } = msgInfoObj;
    const uptime = process.uptime();
    // Response time calculation
    const diff = process.hrtime(start);
    const responseTime = (diff[0] * 1e9 + diff[1]) / 1e6;
    const response = `*🎾 Pong!*\n\n*Response Time:* ${responseTime.toFixed(2)}ms\n*Uptime:* ${uptime.toFixed(2)}s`;
    return sendMessageWTyping(from, { text: response }, { quoted: msg });
};

module.exports.command = () => ({ cmd: ["a", "alive", "ping"], handler });