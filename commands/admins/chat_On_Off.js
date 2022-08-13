module.exports.command = () => {
    let cmd = ["chat"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { groupAdmins, botNumberJid, sendMessageWTyping } = msgInfoObj;
    const isBotGroupAdmin = groupAdmins.includes(botNumberJid);
    if (!isBotGroupAdmin) return sendMessageWTyping(from, { text: `❌ I'm not admin here` }, { quoted: msg });
    if (!args[0]) return sendMessageWTyping(from, { text: `❌ *Provide On/Off*` }, { quoted: msg });

    args[0] = args[0].toLowerCase();
    try {
        if (args[0] == 'off') {
            sock.groupSettingUpdate(from, 'announcement');
            sendMessageWTyping(from, { text: `✔️ *Only Admin can send Message*` }, { quoted: msg });
        } else if (args[0] == 'on') {
            sock.groupSettingUpdate(from, 'not_announcement');
            sendMessageWTyping(from, { text: `✔️ *Allowed all member can send Message*` }, { quoted: msg });
        } else {
            return sendMessageWTyping(from, { text: `❌ *Provide right args*` }, { quoted: msg });
        }
    } catch (err) {
        console.log(err);
    }
}