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
    ─「 *𝐔𝐒𝐄𝐑:- ${msg.pushName}* 
        *𝐆𝐑𝐎𝐔𝐏 𝐍𝐀𝐌𝐄 :- ${groupMetadata.subject}* 」─     
---------------------------------------------------------------

${readMore}

*${prefix}𝐀𝐥𝐢𝐯𝐞*
    _Know if Bot is Online or not_
    _Alias ${prefix}a_

*${prefix}𝐀𝐝𝐦𝐢𝐧*
    _For Admin Commands List_

*${prefix}𝐒𝐨𝐧𝐠*
    _For Downloading songs by name_
    _For Document use song for audio use play_
        Eg:${prefix}song Lelo Pudina

*${prefix}𝐃𝐞𝐥𝐞𝐭𝐞*
    _delete message send by bot_
    _Alias ${prefix} d, ${prefix} delete_

*${prefix}𝐉𝐨𝐤𝐞*
    _Get a Random joke_
    _${prefix}joke categories_
    _Categories: Programming, Misc, Pun, Spooky, Christmas, Dark_

*${prefix}𝐌𝐞𝐦𝐞*
    _Get a random meme_

*${prefix}𝐌𝐨𝐯𝐢𝐞 _Name_* _Not Working_
    _Get Download link for movie_
    _Eg: ${prefix}movie Openhemisphere_

*${prefix}𝐀𝐧𝐢𝐦𝐞*
    _Get a Quote said by Anime Character_

    *Example:*
        _${prefix}anime_
        _${prefix}anime name saitama_
        _${prefix}anime title one punch man_
        
*${prefix}𝐒𝐭𝐢𝐜𝐤𝐞𝐫*
    _Create a sticker from different media types!_
    *Properties of sticker:*
        _crop_ - Used to crop the sticker size!
    *Example:*
        _${prefix}sticker crop_
        
*${prefix}𝐓𝐨𝐢𝐦𝐠*
    _For converting sticker to image_
    _Alias ${prefix}image_

*${prefix}𝐈𝐦𝐠*
    _For search image by google_
    eg: ${prefix}img cute cat_

*${prefix}𝐆𝐞𝐧*
    _Generate a image with your text_
    eg: ${prefix}gen cute cat_

*${prefix}𝐌𝐩3*
    _convert video to audio_
    _Alias ${prefix}mp4audio , ${prefix}tomp3_

*${prefix}𝐅𝐚𝐜𝐭*
    _Get a random Fact_

*${prefix}𝐍𝐞𝐰𝐬*
    _Show Tech News_
    _or ${prefix}news < any category >_
    _Use ${prefix}list for whole valid list_
    _category could be sports, business or anything_

*${prefix}𝐈𝐧𝐬𝐭𝐚*
    _download Instagram media_
    eg:${prefix}insta <linkadress>

*${prefix}𝐘𝐭*
    _download youTube video in best quality_
    eg:${prefix}yt linkadress

*${prefix}𝐕𝐬*
    _search video and download_
    _Eg: ${prefix}vs Transformers Fight Clips_

*${prefix}𝐇𝐨𝐫𝐨*
    _show horoscope_
    eg:${prefix}horo pisces

*${prefix}𝐀𝐝𝐯𝐢𝐜𝐞*
    _get a random advice from bot_

*${prefix}𝐐𝐮𝐨𝐭𝐞*
    _get a random quote from bot_

*${prefix}𝐐𝐩𝐭*
    _get a poet written by authors_
    *Examples:*
        _${prefix}qpt auther Shakespeare title sonnet_
        _${prefix}qpt auther Shakespeare_
        _${prefix}qpt authers_
    _Alies: ${prefix}qpoetry_

*${prefix}𝐑𝐞𝐦𝐨𝐯𝐞𝐛𝐠*
    _remove backgroung from any image_
    _reply to any image only_

*${prefix}𝐓𝐭𝐬*
    _Changes Text to Sticker_
    eg:${prefix}tts we Love Dev

*${prefix}𝐓𝐨𝐭𝐚𝐥*
    _Get total number of messages sent by You in particular group_
    eg:${prefix}total

*${prefix}𝐓𝐨𝐭𝐚𝐥𝐠*
    _Get total number of messages sent by You in all groups_
    eg:${prefix}totalg

*${prefix}𝐓𝐞𝐱𝐭*
    _Add Header and Footer to image_
    _eg: ${prefix}text TopText;BottomText_
    _Font size is optional_
    _Alias: ${prefix}txtmeme_

*${prefix}𝐔𝐝*
    _Show Meaning of your name_
    eg:${prefix}ud SadiQ

*${prefix}𝐃𝐢𝐜*
    _A classic Dictionary_
    eg:${prefix}ud Love

♥ мα∂є ωιтн ℓσνє, υѕє ωιтн ℓσνє ♥️`;


    const helpInDm = `
─「 *Dm Commands Only* 」─
# [ᗩᗪᗪ ᗰE Iᑎ GᖇOᑌᑭ TO ᑌᔕE ᗰY ᖴᑌᒪᒪ ᑭOTEᑎTIᗩᒪ 💀] 

*${prefix}sticker*
    _Create a sticker from different media types!_
    *Property of sticker:*
        _crop_ - Used to crop the sticker size!
    *Example:*
        _${prefix}sticker crop_  x`


    sendMessageWTyping(
        from,
        { text: isGroup ? help : helpInDm }
    );
}
