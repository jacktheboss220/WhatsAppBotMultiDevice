module.exports.command = () => {
    let cmd = ["owner"];
    return { cmd, handler };
}
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { prefix, sendMessageWTyping } = msgInfoObj;

    const owner = `
-------------------------------------------------------------- 
    ─「  *Owner Commands* 」─
---------------------------------------------------------------

${readMore}

*${prefix}blockc* _commands_
    _block command for a group_

*${prefix}removec* _commands_
    _unblock commands for a group_

*${prefix}emptyc*
    _remove all command from db_

*${prefix}block <@mention>*
    _block user from using bot_

*${prefix}unblock <@mention>*
    _unblock user_

*${prefix}removebot*
    _Remove bot from group!_

*${prefix}bb* _text_
    _broadcast text to all groups_

*${prefix}hidetag*
    _tag all participants without tag showing_

*${prefix}jid*
    _get jid for the chat_

♥ мα∂є ωιтн ℓσνє, υѕє ωιтн ℓσνє ♥️`

    sendMessageWTyping(
        from,
        { text: owner }
    );
}