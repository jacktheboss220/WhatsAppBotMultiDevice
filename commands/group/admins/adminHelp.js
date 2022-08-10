module.exports.command = () => {
    let cmd = ["admin"];
    return { cmd, handler };
}
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const handler = async (sock, msg, from, args, msgInfoObj) => {
    let { prefix, groupMetadata } = msgInfoObj;

    const admin = `
---------------------------------------------------------------
    ─「  *${groupMetadata.subject} Admin Commands* 」─
---------------------------------------------------------------

${readMore}

    
*${prefix}add <phone number>*
    _Add any new member!_

*${prefix}ban <@mention>*
    _Kick any member out from group!_
    _Alias with ${prefix}remove, ${prefix}kick_

*${prefix}promote <@mention>*
    _Give admin permission to a member!_

*${prefix}demote <@mention>*
    _Remove admin permission of a member!_

*${prefix}rename <new-subject>*
    _Change group subject!_

*${prefix}chat <on/off>*
    _Enable/disable group chat_
    _${prefix}chat on - for everyone!_
    _${prefix}chat off - for admin only!_

*${prefix}link*
    _Give the group link_

*${prefix}warn <@mention>*
    _Give Waring to a person_
    _Bot Will kick if person got 3 warning!_

*${prefix}unwarn <@mention>*
    _remove Waring to a person!_
    
*${prefix}tagall*
    _For attendance alert_
    _Eg: ${prefix}tagall message!_

♥ мα∂є ωιтн ℓσνє, υѕє ωιтн ℓσνє ♥️`

    sock.sendMessage(
        from,
        { text: admin }
    );
}