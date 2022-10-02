require('dotenv').config();
const LYRICS_KEY = process.env.LYRICS_KEY;

const Genius = require("genius-lyrics");
const Client = new Genius.Client(LYRICS_KEY);
const { getLyrics, getSong } = require('genius-lyrics-api');

module.exports.command = () => {
    let cmd = ["l", "lyric"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;
    if (!args[0]) return sendMessageWTyping(from, { text: "Enter the song name." }, { quoted: msg });
    const searches = await Client.songs.search(evv);
    const firstSong = searches[0];
    try {
        let title = firstSong.title;
        let artist = firstSong.artist.name;
        const options = {
            apiKey: LYRICS_KEY,
            title: title,
            artist: artist,
            optimizeQuery: true
        };
        getLyrics(options).then(async (lyrics) => {
            if (lyrics == null) {
                lyrics = await firstSong.lyrics();
            }
            sendMessageWTyping(
                from,
                {
                    text: title + '\n\n' + lyrics
                },
                {
                    quoted: msg
                }
            )
        }).catch(err => {
            sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
        })
    } catch (err) {
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
    }
}