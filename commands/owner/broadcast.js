const { delay } = require('@adiwajshing/baileys');
module.exports.command = () => {
    let cmd = ["bb", "broadcast"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, sendMessageWTyping } = msgInfoObj;
    return sendMessageWTyping(from, { text: `need Fixing` });

    if (!args[0]) return reply(`Type message to broadcast`);
    evv = '\n─「 ```ʙʀᴏᴀᴅᴄᴀꜱᴛ ᴍᴇꜱꜱᴀɢᴇ ꜱᴇɴᴅ ʙʏ ᴏᴡɴᴇʀ``` 」─\n\n' + evv;
    await sock.groupFetchAllParticipating().then((res) => {
        Object.keys(res).forEach(async (value) => {
            await delay(5000);
            await sock.sendMessage(
                value,
                { text: evv },
            );
        })
    })
}