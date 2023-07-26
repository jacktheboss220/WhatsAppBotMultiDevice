const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

module.exports.command = () => {
    let cmd = ["help"];
    return { cmd, handler };
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { prefix, isGroup, groupMetadata, sendMessageWTyping } = msgInfoObj;

    const help = `
---------------------------------------------------------------
               𝙎𝘼𝘿𝙄𝙌 𝘽𝙊𝙏 🤖
    ─「 *User Name:- ${msg.pushName}* 
        *Group Name :- ${groupMetadata.subject}* 」─     
---------------------------------------------------------------

${readMore}

*${prefix}alive*
    _Know if Bot is Online or not_
    _Alias ${prefix}a_

*${prefix}admin*
    _For Admin Commands List_

*${prefix}song*
    _For Downloading songs by name_
    _For Document use song for audio use play_
        Eg:${prefix}song Lelo Pudina
*${prefix}l* _Removed_
    _Get the lyrics for the song_
    _Eg: ${prefix}l Chalakata hamaro jawaniya by Pawan Singh_

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
    _Eg: ${prefix}movie Openhemisphere_

*${prefix}anime*
    _Get a Quote said by Anime Character_

    *Example:*
        _${prefix}anime_
        _${prefix}anime name saitama_
        _${prefix}anime title one punch man_
        
*${prefix}sticker*
    _Create a sticker from different media types!_
    *Properties of sticker:*
        _crop_ - Used to crop the sticker size!
        _author_ - Add metadata in sticker!
        _pack_ - Add metadata in sticker!
        _nometadata_ - Remove all metadata from sticker!
    *Examples:*
        _${prefix}sticker pack 𝙎𝘼𝘿𝙄𝙌 𝘽𝙊𝙏 🤖 author 𝙈𝙞𝙨𝙖 𝘼𝙢𝙖𝙣𝙚 ❤️_
        _${prefix}sticker crop_
        _${prefix}sticker nometadata_

*${prefix}steal*
        _Send sticker with bot metadata_
        
*${prefix}toimg*
    _For converting sticker to image_
    _Alias ${prefix}image_

*${prefix}img*
    _For search image by google_
    eg: ${prefix}img cute cat_

*${prefix}gen*
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

*${prefix}idp* _Not Working_
    _download Instagram private profile picture_
    eg:${prefix}idp username

*${prefix}insta*
    _download Instagram media_
    eg:${prefix}insta <linkadress>

*${prefix}fb* _Removed_
    _download Facebook public Media_
    eg:${prefix}fb LinkAddress

*${prefix}gender FirstName*
    _get gender % from name_

*${prefix}yt*
    _download youTube video in best quality_
    eg:${prefix}yt linkadress

*${prefix}vs*
    _search video and download_
    _Eg: ${prefix}vs Transformers Fight Clips_

*${prefix}horo*
    _show horoscope_
    eg:${prefix}horo pisces

*${prefix}advice*
    _get a random advice from bot_

*${prefix}quote*
    _get a random quote from bot_

*${prefix}proq* _Removed_
    _get a programming quote from bot_
    _Alies: ${prefix}proquote_

*${prefix}qpt*
    _get a poet written by authors_
    *Examples:*
        _${prefix}qpt auther Shakespeare title sonnet_
        _${prefix}qpt auther Shakespeare_
        _${prefix}qpt authers_
    _Alies: ${prefix}qpoetry_

*${prefix}removebg*
    _remove backgroung from any image_
    _reply to any image only_

*${prefix}tts*
    _Changes Text to Sticker_
    eg:${prefix}tts we Love Dev

*${prefix}total*
    _Get total number of messages sent by You in particular group_
    eg:${prefix}total

*${prefix}totalg*
    _Get total number of messages sent by You in all groups_
    eg:${prefix}totalg

*${prefix}text*
    _Add Header and Footer to image_
    _eg: ${prefix}text TopText;BottomText_
    _Font size is optional_
    _Alias: ${prefix}txtmeme_

*${prefix}ud*
    _Show Meaning of your name_
    eg:${prefix}ud SadiQ

*${prefix}dic*
    _A classic Dictionary_
    eg:${prefix}ud Love

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
        _${prefix}sticker pack sadiq author misa amane_
        _${prefix}sticker crop_
        _${prefix}sticker nometadata_
        
*${prefix}idp* _Not Working_
        _download Instagram private profile picture_
        eg:${prefix}idp eva`


    sendMessageWTyping(
        from,
        { text: isGroup ? help : helpInDm }
    );
}
