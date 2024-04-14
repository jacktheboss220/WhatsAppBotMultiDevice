const fake_quoted = (anu, message) => {
    return {
        key: {
            remoteJid: anu.id,
            fromMe: false,
            id: "810B5GH29EE7481fakeid",
            participant: "0@s.whatsapp.net",
        },
        messageTimestamp: 1122334455,
        pushName: "WhatsApp",
        message: { conversation: message },
    };
};

module.exports = { fake_quoted };