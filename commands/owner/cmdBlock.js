const { getCmdToBlock, setCmdToBlock } = require('../../DB/cmdBlockDB');

module.exports.command = () => {
    let cmd = ["blockc", "emptyc", "getblockc", "removec"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { command, isGroup, sendMessageWTyping } = msgInfoObj;
    if (!isGroup) return;

    var resBlock = await getCmdToBlock(from);

    switch (command) {
        case "blockc":
            if (!args[0]) return sendMessageWTyping(from, { text: `Enter a cmd to block` }, { quoted: msg });
            resBlock = (resBlock == -1 || resBlock == '') ? args[0] : resBlock + ',' + args[0];
            setCmdToBlock(from, resBlock).then(() => {
                console.log("blocked");
                sendMessageWTyping(from, { text: '*Blocked* _' + args[0] + '_ *in this group*.' }, { quoted: msg });
            });
            break;

        case 'emptyc':
            setCmdToBlock(from, '').then(() => {
                console.log('Done');
                sendMessageWTyping(from, { text: `*Unblocked All Cmds in this group.*` }, { quoted: msg });
            });
            break;

        case 'getblockc':
            if (resBlock == -1 || resBlock == '') {
                console.log("empty");
                sendMessageWTyping(from, { text: 'No Command Blocked' }, { quoted: msg });
            } else {
                console.log(resBlock);
                sendMessageWTyping(from, { text: `*Commands Block in this Group are* : ${resBlock}` }, { quoted: msg });
            }
            break;

        case 'removec':
            if (!args[0]) return reply(`Enter a cmd to block`);
            let resBlockC = [];
            resBlock = resBlock.split(",");
            for (let i = 0; i < resBlock.length; i++) {
                if (resBlock[i] == args[0]);
                else
                    resBlockC.push(resBlock[i]);
            }
            setCmdToBlock(from, resBlockC.toString()).then(() => {
                sendMessageWTyping(from, { text: '*Allowed* _' + args[0] + '_ *in this Group*.' }, { quoted: msg })
            })
            break;
        default:
            break;
    }


}
