const { group } = require('../../../mongo-DB/groupDataDb');

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, groupMetadata } = msgInfoObj;
    const allParticipants = groupMetadata.participants.filter(p => p.admin == null).map(p => p.id);
    let numberOfMessages = args?.length == 1 ? parseInt(args[0]) : 0;

    group.findOne({ _id: from }).then(res => {
        group.aggregate([
            { $match: { _id: from } },
            { $unwind: "$members" },
            { $sort: { "members.count": -1 } },
            { $group: { _id: "$_id", items: { $push: "$members" } } }
        ]).toArray().then(r => {

            let filtered = allParticipants.map(p => {
                let found = r[0].items.find(m => m.id == p);
                if (found == undefined) {
                    return { id: p, count: 0 };
                }
                return found;
            }).filter(p => p.count <= numberOfMessages);

            let mess = "____________________________\n\n*Group Name:* " + res.grpName + '\n*Members <= ' + numberOfMessages + ' Count.*' + '\n*Total Zero Members:* ' + filtered.length + '\n____________________________\n\n' + readMore + '\n';
            filtered.forEach(element => {
                mess += element.id.split("@")[0] + ',\n'
            });
            sendMessageWTyping(from, { text: mess }, { quoted: msg });

        });
    })
}

module.exports.command = () => ({
    cmd: ['zero'],
    desc: 'Get members with zero message count',
    usage: 'zero <number> | zero',
    handler
});
