const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;
    // return sendMessageWTyping(
    //     from,
    //     { text: "```❎ The admin commands are blocked for sometime to avoid ban on whatsapp!```" },
    //     { quoted: msg }
    // );
    if (!groupAdmins.includes(botNumberJid)) {
        return sendMessageWTyping(from, { text: "❎ Bot needs to be admin to add members." }, { quoted: msg });
    }
    if (!evv && (!msg.message.extendedTextMessage && !args[0])) {
        return sendMessageWTyping(from, { text: "❎ Provide a number or reply to a member's message." }, { quoted: msg });
    }
    let participant = msg.message.extendedTextMessage ? msg.message.extendedTextMessage.contextInfo.participant : evv.split(" ").join("");
    if (participant.startsWith("@")) {
        return sendMessageWTyping(from, { text: "Don't tag, provide the number." }, { quoted: msg });
    }
    participant = participant.includes("@s.whatsapp.net") ? participant : `${participant}@s.whatsapp.net`;
    if (participant.startsWith("+")) {
        participant = participant.split("+")[1];
    }
    try {
        const res = await sock.groupParticipantsUpdate(from, [participant], "add");
        const status = res[0].status;
        let text;
        switch (status) {
            case '400':
                text = "❎ Invalid number, include country code.";
                break;
            case '403':
                text = "❎ Number has privacy setting on adding to group.";
                break;
            case '408':
                text = "❎ Number has left the group recently.";
                break;
            case '409':
                text = "❎ Number is already in group.";
                break;
            case '500':
                text = "❎ Group is full.";
                break;
            case '200':
                text = "✅ Number added to group.";
                break;
            default:
                text = "❎ An error has occurred.";
                break;
        }
        sendMessageWTyping(from, { text: text }, { quoted: msg });
    } catch (error) {
        sendMessageWTyping(from, { text: error.toString() }, { quoted: msg });
        console.error(error);
    }
};

module.exports.command = () => ({ cmd: ["add"], handler });