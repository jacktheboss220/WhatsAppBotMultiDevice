import axios from "axios";

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    const factURL = "https://nekos.life/api/v2/fact";
    try {
        await axios(factURL).then((res) => {
            sock.sendMessage(from, {
                text: `ʕ•̫͡•ʔ Fact ʕ•̫͡•ʔ\n\n${res.data.fact}`
            }, { quoted: msg });
        });
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    }
}


export default () => ({
    cmd: ["fact"],
    desc: "Get random fact",
    usage: "fact",
    handler
});

