require('dotenv').config();
const GENIUS_ACCESS_SECRET = process.env.GENIUS_ACCESS_SECRET || "";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const Genius = require("genius-lyrics");
const { getLyrics } = require("genius-lyrics-api");
const Client = new Genius.Client(GENIUS_ACCESS_SECRET);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping, evv } = msgInfoObj;

    if (!GENIUS_ACCESS_SECRET)
        return sendMessageWTyping(from,
            { text: "```Genius Access Secret is Missing```" },
            { quoted: msg }
        );

    if (!args[0]) return sendMessageWTyping(from, { text: "Enter the song name." }, { quoted: msg });

    const searches = await Client.songs.search(evv);
    const firstSong = searches[0];
    let lyric;
    try {
        lyric = await firstSong.lyrics(true);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (lyric == null || lyric == undefined || lyric == "") {
            lyric = await getLyrics({ apiKey: GENIUS_ACCESS_SECRET, title: firstSong.title, artist: firstSong.artist.name, optimizeQuery: true });
        }
    } catch (error) {
        sendMessageWTyping(from, { text: error.toString() }, { quoted: msg });
    }

    const mess = `*Name*: ${firstSong.title}\n*Artist*: ${firstSong.artist.name}\n*Lyrics*: ${readMore}${lyric}`;

    if (lyric) {
        sendMessageWTyping(from, { text: mess }, { quoted: msg });
    } else {
        sendMessageWTyping(from, { text: "Lyrics not found." }, { quoted: msg });
    }
}

module.exports.command = () => ({ cmd: ["l", "lyric"], handler });