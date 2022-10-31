module.exports.command = () => {
    let cmd = ["add"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { prefix, evv, groupAdmins, sendMessageWTyping, botNumberJid } = msgInfoObj;

    if (!groupAdmins.includes(botNumberJid)) return sendMessageWTyping(from, { text: `❌ Bot Needs To Be Admin In Order To Add Members.` }, { quoted: msg });

    let taggedJid;
    if (msg.message.extendedTextMessage) {
        taggedJid = msg.message.extendedTextMessage.contextInfo.participant;
    }
    else {
        if (!args[0]) return sendMessageWTyping(from, { text: `❌ Provide Number Or Reply On Member's Message` }, { quoted: msg });

        evv = evv.split(" ").join();
        if ((evv.startsWith("@"))) {
            return sendMessageWTyping(from, { text: "Don't Tag, Provide the number." }, { quoted: msg });
        } else {
            taggedJid = evv + '@s.whatsapp.net';
        }
        if (evv.startsWith("+"))
            evv = evv.split("+")[1];
    }
    try {
        await sock.groupParticipantsUpdate(
            from,
            [taggedJid],
            "add"
        ).then(res => {
            let get_status = res[0].status;
            if (get_status == '400') {
                sendMessageWTyping(from, { text: "_❌ Invalid number, include country code also!_" }, { quoted: msg });
            } else if (get_status == '403') {
                sendMessageWTyping(from, { text: "_❌ Number has privacy on adding group!_" }, { quoted: msg });
            } else if (get_status == '408') {
                sendMessageWTyping(from, { text: "_❌ Number has left the group recently!_" }, { quoted: msg });
            } else if (get_status == '409') {
                sendMessageWTyping(from, { text: "_❌ Number is already in group!_" }, { quoted: msg });
            } else if (get_status == '500') {
                sendMessageWTyping(from, { text: "_❌ Group is currently full!_" }, { quoted: msg });
            } else if (get_status == '200') {
                sendMessageWTyping(from, { text: "_✔️ Number added to group!_" }, { quoted: msg });
            }
        })
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log("Error", err);
    }
}