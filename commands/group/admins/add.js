module.exports.command = () => {
    let cmd = ["add"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { prefix, evv, groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;

    if (!groupAdmins.includes(botNumberJid)) return sendMessageWTyping(from, { text: `❌ I'm not admin here` }, { quoted: msg });

    let taggedJid;
    if (msg.message.extendedTextMessage) {
        taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
    }
    else {
        if (!args[0]) return sendMessageWTyping(from, { text: `❌ Give number or tag on message` }, { quoted: msg });
        
        evv = evv.replace(" ", "");
        if ((evv.startsWith("@"))) {
            return sendMessageWTyping(from, { text: "Don't Tag, Provide the number." }, { quoted: msg })
        } else {
            taggedJid = evv + '@s.whatsapp.net';
        }
        if (evv.startsWith("+"))
            evv = evv.split("+")[1];
    }
    try {
        const response = await sock.groupParticipantsUpdate(
            from,
            [taggedJid],
            "add"
        )
        console.log(response);
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log("Error", err);
    }
}