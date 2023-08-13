const { createMembersData, getMemberData, member } = require("../../mongo-DB/membersDataDb");

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, senderJid, evv } = msgInfoObj;

    const memberData = await getMemberData(senderJid);
    let customStealText = memberData.customStealText;

    if (customStealText != "" && args.length == 0) {
        return sendMessageWTyping(from,
            { text: "*Custom steal Text* :" + customStealText },
            { quoted: msg }
        );
    } else {
        if (!evv) return sendMessageWTyping(from, { text: "*Provide some text*" }, { quoted: msg });
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
