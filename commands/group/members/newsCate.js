const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping } = msgInfoObj;
    // const sections = [
    //     {
    //         title: "Categories",
    //         rows: [
    //             { title: `${prefix}news world`, rowId: "option1", description: "get world news" },
    //             { title: `${prefix}news national`, rowId: "option2", description: "get national news" },
    //             { title: `${prefix}news business`, rowId: "option3", description: "get business news" },
    //             { title: `${prefix}news sports`, rowId: "option4", description: "get sports news" },
    //             { title: `${prefix}news politics`, rowId: "option5", description: "get politics news" },
    //             { title: `${prefix}news technology`, rowId: "option6", description: "get technology news" },
    //             { title: `${prefix}news startup`, rowId: "option7", description: "get startup news" },
    //             { title: `${prefix}news entertainment`, rowId: "option8", description: "get entertainment news" },
    //             { title: `${prefix}news miscellaneous`, rowId: "option9", description: "get miscellaneous news" },
    //             { title: `${prefix}news hatke`, rowId: "option10", description: "get unusual news" },
    //             { title: `${prefix}news science`, rowId: "option11", description: "get science news" },
    //             { title: `${prefix}news automobile`, rowId: "option12", description: "get automobile news" }
    //         ]
    //     },
    // ]

    // const listMessage = {
    //     text: "News By Categories",
    //     footer: "Send by mybitbot",
    //     viewOnce: true,
    //     // title: "News By InShorts-Api",
    //     buttonText: "Click here",
    //     sections
    // }

    const typeOfNews = ['world', 'national', 'business', 'sports', 'politics', 'technology', 'startup', 'entertainment', 'miscellaneous', 'hatke', 'science', 'automobile']
    // await sock.sendMessage(from, listMessage);

    sendMessageWTyping(from, {
        text: typeOfNews.map((e, i) => `${i + 1}. ${e}`).join("\n"),
    }, { quoted: msg });
}

module.exports.command = () => ({ cmd: ["categories", "cate"], handler })