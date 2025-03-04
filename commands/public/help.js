require("dotenv").config();

const { cmdToText } = require("../../functions/getAddCommands");

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { isGroup, sendMessageWTyping } = msgInfoObj;
    let prefix = process.env.PREFIX;

    const { publicCommands } = await cmdToText();

    const help = `
---------------------------------------------------------------
    *Wҽʅƈσɱҽ ƚσ Eʋα Bσƚ*
---------------------------------------------------------------
${readMore}

${publicCommands.map((cmd) => `*${prefix}${cmd.cmd.join(", ")}* - ${cmd.desc}\nUsage: ${prefix}${cmd.usage}`).join("\n\n")}

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

*${prefix}donate*
    _Donate to keep this bot alive!_
    _Alias ${prefix}donation_`;

    await sendMessageWTyping(from, {
        text: isGroup ? help : helpInDm,
    });
}

module.exports.command = () => ({
    cmd: ['help', 'menu'],
    desc: "Help menu",
    usage: "help",
    handler
});