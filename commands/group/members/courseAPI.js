const axios = require('axios');

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    var new_order = 'date';
    var new_page = args ? args[0] : 1;
    var arg_free = 0;
    var arg_keyword = "";
    var arg_language = "";
    let mess = '';
    await axios('https://www.real.discount/api/all-courses/?store=Udemy&page=' + new_page + '&per_page=10&orderby=' + new_order + '&free=' + arg_free + '&search=' + arg_keyword + '&language=' + arg_language).then((res) => {
        res.data.results.forEach(value => {
            mess += "Name: " + value.name + "\n" + "URL: " + value.url + '\n\n';
        });
        sendMessageWTyping(from, { text: mess }, { quoted: msg })
    }).catch((err) => {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        console.log(err);
    })
}

module.exports.command = () => ({
    cmd: ["un"],
    desc: "Get Udemy courses for free",
    usage: "un | <page number>",
    handler
});