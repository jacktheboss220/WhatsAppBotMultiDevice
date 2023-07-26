const { createMembersData, getMemberData, member } = require("../../mongo-DB/membersDataDb");

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, senderJid, evv } = msgInfoObj;

    const memberData = await getMemberData(senderJid);

    if (!args[0] && !memberData.customStealText) {
        return sendMessageWTyping(from,
            { text: "*Custom steal Text* :" + (memberData.customStealText ?? " Not Set") },
            { quoted: msg }
        );
    } else {
        member.updateOne({ _id: senderJid }, { $set: { customStealText: evv } }, { upsert: true }).then((res) => {
            sendMessageWTyping(from,
                { text: "*Custom steal text set!* " + evv },
                { quoted: msg }
            );
        }).catch((err) => {
            console.log(err);
            sendMessageWTyping(from,
                { text: "*An error occurred while setting custom steal text!*" },
                { quoted: msg }
            );
        });
    }
};

module.exports.command = () => ({ cmd: ["sets", "stealText"], handler });