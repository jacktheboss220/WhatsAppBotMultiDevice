import axios from 'axios'
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const poetURL = 'https://poetrydb.org/';

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;
    if (!args) return sendMessageWTyping(from, { text: "Provide author argument." }, { quoted: msg });
    if (args.length == 1 && args[0].toLowerCase() == "authors") {
        await axios(poetURL + '/author').then((res) => {
            try {
                let mess = `\n-------------------------------------------------------------\n\n:  *All AUTHORS* : \n\n${readMore}: -------------------------------------------------------------: \n\n`;
                let i = 1;
                Object.values(res.data.authors).forEach(value => {
                    mess += i++ + "- " + value.trim() + "\n";
                });
                mess += '\n-------------------------------------------------------------';
                sendMessageWTyping(from, { text: mess }, { quoted: msg });
            } catch {
                sendMessageWTyping(from, { text: res.data.reason }, { quoted: msg });
            }
        }).catch((err) => {
            console.log(err);
        })
        return;
    }
    if (args.length == 0) return sendMessageWTyping(from, { text: `Enter author.\n add authors to know all auther.` }, { quoted: msg });
    if (args.includes("author") && args.includes("title")) {
        let author = evv.substring(evv.indexOf("author") + 7, evv.lastIndexOf("title")).trim().split(" ").join("%20");
        let title = evv.substring(evv.indexOf("title") + 6).trim().split(" ").join("%20");
        if (title == "") return sendMessageWTyping(from, { text: `Enter the title/author.` }, { quoted: msg });
        await axios(poetURL + 'author,title/' + author + ';' + title).then((res) => {
            try {
                let mess = `\n-------------------------------------------------------------\n\n: ${res.data[0].author} : \n-------------------------------------------------------------\n\nTitle ${res.data[0].title}\n\n-------------------------------------------------------------\n\n${readMore}`;
                Object.values(res.data[0].lines).forEach(value => {
                    mess += value.trim() + "\n";
                });
                mess += '\n-------------------------------------------------------------'
                sendMessageWTyping(from, { text: mess }, { quoted: msg });
            } catch {
                sendMessageWTyping(from, { text: res.data.reason }, { quoted: msg });
            }
        }).catch((err) => {
            console.log(err);
        })
    } else if (args.includes("author")) {
        let author = evv.substring(evv.indexOf("author") + 7).trim().split(" ").join("%20");
        await axios(poetURL + 'author/' + author + '/title').then((res) => {
            try {
                let mess = `\n-------------------------------------------------------------\n\n:  *${author}*'s Work  : \n\n${readMore}: -------------------------------------------------------------: \n\n`;
                let i = 1;
                Object.values(res.data).forEach(value => {
                    mess += i++ + "- " + value.title.trim() + "\n";
                });
                mess += '\n-------------------------------------------------------------';
                sendMessageWTyping(from, { text: mess }, { quoted: msg });
            } catch {
                sendMessageWTyping(from, { text: res.data.reason }, { quoted: msg });
            }
        }).catch((err) => {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
            console.log(err);
        })
    } else {
        sendMessageWTyping(from, { text: `Must include author in command` }, { quoted: msg })
    }
}

export default () => ({
    cmd: ['qpt', 'qpoetry'],
    desc: 'Get random poetry',
    usage: 'qpoetry <author>',
    handler
});