const { group } = require('../../../mongo-DB/groupDataDb');

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, senderJid } = msgInfoObj;

    taggedJid = msg?.message?.extendedTextMessage?.contextInfo?.participant;
    const filter = {
        'members.id': taggedJid || senderJid
    };
    group.find(filter).toArray().then(res => {
        if (res) {
            let mess = '', userName = '', totalMessageCount = 0;
            res.sort((a, b) => {
                return b.members.find(member => member.id === taggedJid || (!taggedJid && member.id === senderJid)).count - a.members.find(member => member.id === taggedJid || (!taggedJid && member.id === senderJid)).count;
            });
            res.forEach(grp => {
                let data = grp.members.filter((member) => {
                    return member.id === taggedJid || (!taggedJid && member.id === senderJid);
                });
                userName = data[0].name;
                totalMessageCount += data[0].count;
                mess += `${data[0].count} - ${grp.grpName}\n`;
            });
            sendMessageWTyping(from, {
                text: `*${userName}'s Message Count In All Groups are*: ${totalMessageCount}\n\n ${readMore}\n\n${mess}`
            }, { quoted: msg });
        } else {
            sendMessageWTyping(from, { text: "No Data Found" }, { quoted: msg });
        }
    })
}

module.exports.command = () => ({
    cmd: ["totalg"],
    desc: "Get your message count in all groups",
    usage: "totalg | reply to a message to get message count of that member",
    handler
});