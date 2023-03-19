const axios = require('axios');

const getAnimeRandom = async (name) => {
    const animeUrl = 'https://animechan.vercel.app/api/';
    let mes = '';
    const response = await axios.get(`${animeUrl}` + name);

    if (name === 'random') {
        mes = `*Anime*: ${response.data.anime}\n*Character*: ${response.data.character}\n*Quote*: ${response.data.quote}`;
    } else {
        const i = response.data.length === 1 ? 0 : Math.floor(Math.random() * 11);
        mes = `*Anime*: ${response.data[i].anime}\n*Character*: ${response.data[i].character}\n*Quote*: ${response.data[i].quote}`;
    }

    return mes ? mes : Promise.reject('Anime or Character not found!! Enter right Spelling or different Anime or Character.');
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { evv, sendMessageWTyping } = msgInfoObj;
    let url;

    if (evv.includes('name')) {
        url = `quotes/character?name=${evv.toLowerCase().substring(4).trim().split(' ').join('+')}`;
    } else if (evv.includes('title')) {
        url = `quotes/anime?title=${evv.toLowerCase().substring(6).trim().split(' ').join('%20')}`;
    } else {
        url = 'random';
    }

    try {
        const message = await getAnimeRandom(url);
        sendMessageWTyping(from, { text: message }, { quoted: msg });
    } catch (err) {
        console.error('Error in getAnimeRandom:', err);
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
};

module.exports.command = () => ({ cmd: ["anime"], handler });
