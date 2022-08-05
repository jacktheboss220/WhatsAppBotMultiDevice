module.exports.command = () => {
    let cmd = ["add"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, evv, groupAdmins, sendMessageWTyping } = msgInfoObj;

    if (!groupAdmins.includes(sock.user.id)) return sendMessageWTyping(from, { text: `❌ I'm not admin here` }, { quoted: msg });

    let taggedJid;
    if (msg.message.extendedTextMessage) {
        taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
    }
    else {
        if (!args[0]) return sendMessageWTyping(from, { text: `❌ Give number or tag on message` }, { quoted: msg });
        if (evv.startsWith("+")) evv = evv.split("+")[1];
        taggedJid = evv + '@s.whatsapp.net';
    }
    try {
        const response = await sock.groupParticipantsUpdate(
            from,
            [taggedJid],
            "add"
        )
        sendMessageWTyping(from, { text: `*If number is not added then it might have privacy on adding. *` }, { quoted: msg })
        console.log(response);
    } catch (err) {
        console.log("Error", err);
    }
}