module.exports.command = () => {
    let cmd = ["link", "grplink", "getlink"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;

    if (!groupAdmins.includes(botNumberJid)) return sendMessageWTyping(from, { text: `❌ I'm not admin here` }, { quoted: msg });
    try {
        const gc_invite_code = await sock.groupInviteCode(from);
        gc_link = `https://chat.whatsapp.com/${gc_invite_code}`;
        sock.sendMessage(
            from,
            {
                text: gc_link,
                detectLinks: true
            },
            { quoted: msg }
        );
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    }
}