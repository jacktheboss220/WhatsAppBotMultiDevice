const { getGroupData, group } = require('../../../mongo-DB/groupDataDb');

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { command, isGroup, sendMessageWTyping } = msgInfoObj;
    if (!isGroup) return sendMessageWTyping(from, { text: 'Use In Group Only!' }, { quoted: msg });

    var resBlock = await getGroupData(from);
    if (resBlock == -1) return sendMessageWTyping("NO data found in DB");
    let blockCommandsInDB = resBlock.cmdBlocked;

    switch (command) {
        case "blockc":
            if (!args[0]) return sendMessageWTyping(from, { text: `Enter a cmd to block` }, { quoted: msg });
            if (blockCommandsInDB.includes(args[0])) {
                sendMessageWTyping(from, { text: 'Command Already Blocked' }, { quoted: msg });
            } else {
                group.findOne({ _id: from }).then(res => {
                    group.updateOne({ _id: from }, { $push: { cmdBlocked: { $each: args[0].split(",") } } }).then(() => {
                        sendMessageWTyping(from, { text: '*Blocked* _' + args[0] + '_ *in this group*.' }, { quoted: msg });
                    })
                })
            }
            break;

        case 'emptyc':
            group.updateOne({ _id: from }, { $set: { cmdBlocked: [] } }).then(() => {
                console.log('Done');
                sendMessageWTyping(from, { text: `*No CMD Blocked in this group*` }, { quoted: msg });
            });
            break;

        case 'getblockc':
            sendMessageWTyping(from, { text: `*Commands Block in this Group are* : ${resBlock.cmdBlocked.toString()}` }, { quoted: msg });
            break;

        case 'removec':
            if (!args[0]) return sendMessageWTyping(from, { text: `Enter a cmd to block` }, { quoted: msg });
            group.updateOne({ _id: from }, { $pullAll: { cmdBlocked: args[0].split(",") } }).then(() => {
                sendMessageWTyping(from, { text: '*UnBlocked* _' + args[0] + '_ *in this Group*.' }, { quoted: msg })
            })
            break;
            
        default:
            break;
    }
}

module.exports.command = () => ({ cmd: ["blockc", "emptyc", "getblockc", "removec"], handler });