const axios = require('axios');

module.exports.command = () => {
    let cmd = ["anime"];
    return { cmd, handler };
}


const getAnimeRandom = async (name) => {
    const animeUrl = 'https://animechan.vercel.app/api/';
    let mes = '';
    const response = await axios.get(`${animeUrl}` + name);
    if (name == 'random') {
        mes = '*Anime* : ' + response.data.anime + '\n*Character* : ' + response.data.character + '\n*Quote* : ' + response.data.quote;
    }
    else {
        let i = (response.data.length == 1) ? 0 : Math.floor(Math.random() * 11);
        mes = '*Anime* : ' + response.data[i].anime + '\n*Character* : ' + response.data[i].character + '\n*Quote* : ' + response.data[i].quote;
    }
    return new Promise((resolve, reject) => {
        if (mes != '') {
            resolve(mes)
        } else {
            reject('Anime or Character not found!! Enter right Spelling or different Anime or Character.')
        }
    })
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, sendMessageWTyping } = msgInfoObj;
    let mess = '';
    if (evv.includes('name')) {
        getAnimeRandom('quotes/character?name=' + evv.toLowerCase().substring(4).trim().split(" ").join("+")).then((message) => {
            sendMessageWTyping(from, { text: message }, { quoted: msg });
        }).catch((error) => {
            console.log(error);
        });
    } else if (evv.includes('title')) {
        mess = getAnimeRandom('quotes/anime?title=' + evv.toLowerCase().substring(6).trim().split(" ").join("%20")).then((message) => {
            sendMessageWTyping(from, { text: message }, { quoted: msg });
        }).catch((error) => {
            console.log(error);
        });
    } else {
        getAnimeRandom('random').then((message) => {
            sendMessageWTyping(from, { text: message }, { quoted: msg });
        }).catch((error) => {
            console.log(error);
        })
    }
}