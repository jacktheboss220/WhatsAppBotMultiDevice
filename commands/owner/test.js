module.exports.command = () => {
    let cmd = ["test"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;

    // if (!msg.message.extendedTextMessage) return sendMessageWTyping(from, { text: "❌ Tag / mentioned!" });

    // let taggedJid;
    // if (msg.message.extendedTextMessage) {
    //     taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
    // } else {
    //     taggedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    // }
    // sendMessageWTyping(from, { text: taggedJid });
    // Outside of Async Function
    instagram.insta_profile("cheems").then(async (data) => {
        console.log(data);
        sendMessageWTyping(from, { text: JSON.stringify(data) })
    })
}