const handler = async (sock, msg, from, args, msgInfoObj) => {
    const start = process.hrtime();
    const { sendMessageWTyping } = msgInfoObj;
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const simpleUptime = `${hours}h ${minutes}m ${seconds}s`;
    // Response time calculation
    const diff = process.hrtime(start);
    const responseTime = (diff[0] * 1e9 + diff[1]) / 1e6;
    const response = `*🎾 Pong!*\n\n*Response Time:* ${responseTime}ms\n*Uptime:* ${simpleUptime}`;
    return sendMessageWTyping(from, { text: response }, { quoted: msg });
};

module.exports.command = () => ({ cmd: ["a", "alive", "ping"], handler });