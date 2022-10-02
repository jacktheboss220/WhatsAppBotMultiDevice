const axios = require('axios');
module.exports.command = () => {
    let cmd = ["un"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    var neworder = 'date';
    var newpage = args ? args[0] : 1;
    var arg_free = 0;
    var arg_keyword = "";
    var arg_language = "";
    let mess = '';
    await axios('https://www.real.discount/api/all-courses/?store=Udemy&page=' + newpage + '&per_page=10&orderby=' + neworder + '&free=' + arg_free + '&search=' + arg_keyword + '&language=' + arg_language).then((res) => {
        res.data.results.forEach(value => {
            mess += "Name: " + value.name + "\n" + "URL: " + value.url + '\n\n';
        });
        sendMessageWTyping(from, { text: mess }, { quoted: msg })
    }).catch((err) => {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    })
}
//     headers: {
// const res = await axios.get('https://www.real.discount/api/all-courses/?store=Udemy&page=' + newpage + '&per_page=10&orderby=' + neworder + '&free=' + arg_free + '&search=' + arg_keyword + '&language=' + arg_language, {
//         accept:
//             "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
//         pragma: "no-cache",
//         "user-agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36 Edg/89.0.774.77",
//     },
//     referrerPolicy: "strict-origin-when-cross-origin",
//     method: "GET",
// });
// console.log(res.data);