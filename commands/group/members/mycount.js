const { group } = require('../../../mongo-DB/groupDataDb');

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, senderJid } = msgInfoObj;

    taggedJid = msg?.message?.extendedTextMessage?.contextInfo?.participant;
    const filter = {
        '_id': from,
        'members': {
            '$elemMatch': {
                'id': taggedJid || senderJid
            }
        }
    };

    group.findOne(filter).then(res => {
        if (res) {
            let data = res.members.filter((element) => {
                return element.id === taggedJid || (!taggedJid && element.id === senderJid);
            });
            sendMessageWTyping(from, {
                text: `${data[0].name}'s Message Count In Group is ${data[0].count}`
            }, { quoted: msg });
        } else {
            sendMessageWTyping(from, { text: "No Data Found" }, { quoted: msg });
        }
    })

}

module.exports.command = () => ({ cmd: ["mycount", "total"], handler });