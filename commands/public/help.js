const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { prefix, isGroup, groupMetadata, sendMessageWTyping, senderJid } = msgInfoObj;
    // *User Name:- ${msg.pushName}*
    // *Group Name:- ${groupMetadata.subject}*

    const help = `
---------------------------------------------------------------
    *Wҽʅƈσɱҽ ƚσ Eʋα Bσƚ*
---------------------------------------------------------------
${readMore}

*${prefix}alive*
    _Know if Bot is Online or not_
    _Alias ${prefix}a_

*${prefix}admin*
    _For Admin Commands List_

*${prefix}song*
    _For Downloading songs by name_
    _For Document use ${prefix}song for audio use ${prefix}play_
        Eg:${prefix}song love me like you do

*${prefix}delete*
    _delete message send by bot_
    _Alias ${prefix} d, ${prefix} delete_

*${prefix}joke*
    _Get a Random joke_
    _${prefix}joke categories_
    _Categories: Programming, Misc, Pun, Spooky, Christmas, Dark_

*${prefix}meme*
    _Get a random meme_

*${prefix}movie _Name_* _Not Working_
    _Get Download link for movie_
    _Eg: ${prefix}movie Avengers_

*${prefix}sticker*
    _Create a sticker from different media types!_
    *Properties of sticker:*
        _crop_ - Used to crop the sticker size!
        _author_ - Add metadata in sticker!
        _pack_ - Add metadata in sticker!
        _nometadata_ - Remove all metadata from sticker!
    *Examples:*
        _${prefix}sticker pack myBitBot author MD_
        _${prefix}sticker crop_
        _${prefix}sticker nometadata_

*${prefix}steal*
        _Send sticker with bot metadata_
    *Examples:*
        _${prefix}steal this is eva_
        
*${prefix}sets*
        _Set custom steal text_
        _reply with only steal to get custom set pack name_
        _Alias ${prefix}stealText_
    *Examples:*
        _${prefix}sets jacktheboss220_
        
*${prefix}toimg*
    _For converting sticker to image_
    _Alias ${prefix}image_

*${prefix}img*
    _For search image by google_
    eg: ${prefix}img cute cat_

*${prefix}search*
    _For search text by google_
    eg: ${prefix}search cats_
    _Alias ${prefix}gs cats_

*${prefix}gen* _Not Working_
    _Generate a image with your text_
    eg: ${prefix}gen cute cat_

*${prefix}mp3* 
    _convert video to audio_
    _Alias ${prefix}mp4audio , ${prefix}tomp3_

*${prefix}fact*
    _Get a random Fact_

*${prefix}news*
    _Show Tech News_
    _or ${prefix}news < any category >_
    _Use ${prefix}list for whole valid list_
    _category could be sports, business or anything_

*${prefix}idp*
    _download Instagram private profile picture_
    eg:${prefix}idp username

*${prefix}insta*
    _download Instagram media_
    eg:${prefix}insta linkAddress

*${prefix}gender FirstName*
    _get gender % from name_

*${prefix}yt*
    _download youTube video in best quality_
    eg:${prefix}yt linkAddress
       ${prefix}ytv linkAddress
       ${prefix}yta linkAddress download as audio

*${prefix}vs*
    _search video and download_
    _Eg: ${prefix}vs shameless_

*${prefix}horo*
    _show horoscope_
    eg:${prefix}horo pisces

*${prefix}advice*
    _get a random advice from bot_

*${prefix}quote*
    _get a random quote from bot_

*${prefix}qpt*
    _get a poet written by authors_
    *Examples:*
        _${prefix}qpt author Shakespeare title sonnet_
        _${prefix}qpt author Shakespeare_
        _${prefix}qpt authors
    _Alies: ${prefix}qpoetry_

*${prefix}removebg*
    _remove background from any image_
    _reply to any image only_

*${prefix}tts*
    _Changes Text to Sticker_
    eg:${prefix}tts we Love Dev

*${prefix}say*
    _Text To Speech_
    eg:${prefix}say we Love Dev (for english language)
    eg:${prefix}say hin we Love Dev (for hindi language)

*${prefix}total*
    _Get total number of messages sent by You in particular group_
    eg:${prefix}total

*${prefix}totalg*
    _Get total number of messages sent by You in all groups_
    eg:${prefix}totalg

*${prefix}text*
    _Add Header and Footer to image_
    _Format FontTop;FontBottom;FontSize;FontColor;FontStrokeColor_
    _eg: ${prefix}text TopText;BottomText_
    _Font size is optional_
    _Alias: ${prefix}txtmeme_

*${prefix}ud*
    _Show Meaning of your name_
    eg:${prefix}ud Mahesh

*${prefix}dict*
    _A classic Dictionary_
    eg:${prefix}dict Love

*${prefix}source*
    _Get the source code!_

♥ мα∂є ωιтн ℓσνє, υѕє ωιтн ℓσνє ♥️`;


    const helpInDm = `
─「 *Dm Commands* 」─

*${prefix}sticker*
    _Create a sticker from different media types!_
    *Properties of sticker:*
        _crop_ - Used to crop the sticker size!
        _author_ - Add metadata in sticker!
        _pack_ - Add metadata in sticker!
        _nometadata_ - Remove all metadata from sticker!
    *Examples:*
        _${prefix}sticker pack eva author jacktheboss220_
        _${prefix}sticker crop_
        _${prefix}sticker nometadata_
`;

    await sendMessageWTyping(from, {
        text: isGroup ? help : helpInDm,
        // mentions: [senderJid]
    });
}
module.exports.command = () => ({ cmd: ['help', 'menu'], handler });
