const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { groupAdmins, groupMetadata, sendMessageWTyping, botNumberJid } = msgInfoObj;
    // return sendMessageWTyping(
    //     from,
    //     { text: "```❎ The admin commands are blocked for sometime to avoid ban on whatsapp!```" },
    //     { quoted: msg }
    // );

    if (!groupAdmins.includes(botNumberJid)) {
        return sendMessageWTyping(from, { text: '❎ I\'m not admin here' }, { quoted: msg });
    }

    if (!msg.message.extendedTextMessage) {
        return sendMessageWTyping(from, { text: 'Mention or tag member.' }, { quoted: msg });
    }

    const taggedJid = msg.message.extendedTextMessage.contextInfo.participant || msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    if (taggedJid === groupMetadata.owner) {
        return sendMessageWTyping(from, { text: '❎ *Group Owner Tagged*' }, { quoted: msg });
    }

    try {
        await sock.groupParticipantsUpdate(from, [taggedJid], "promote");
        sendMessageWTyping(from, { text: `✅ *Promoted*` }, { quoted: msg });
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.error(err);
    }
}

module.exports.command = () => ({ cmd: ["promote"], handler })