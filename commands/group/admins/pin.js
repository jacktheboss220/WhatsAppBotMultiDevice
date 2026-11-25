// WhatsApp only allows these pin durations (seconds).
const DURATIONS = { "24h": 86400, "7d": 604800, "30d": 2592000 };

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { botNumber, groupAdmins, sendMessageWTyping, extendedMessageOriginal, command } =
    msgInfoObj;
  const reply = (text) => sendMessageWTyping(from, { text }, { quoted: msg });

  if (!groupAdmins.includes(botNumber[0]) && !groupAdmins.includes(botNumber[1])) {
    return reply(`❌ I'm not admin here`);
  }
  if (!extendedMessageOriginal) return reply(`❌ Reply to the message you want to ${command}.`);

  const unpin = command === "unpin";
  const time = DURATIONS[(args[0] || "24h").toLowerCase()];
  if (!unpin && !time) return reply(`❌ Duration must be one of: ${Object.keys(DURATIONS).join(", ")}`);

  const key = {
    remoteJid: from,
    fromMe: false,
    id: extendedMessageOriginal.stanzaId,
    participant: extendedMessageOriginal.participant,
  };

  try {
    await sendMessageWTyping(from, unpin ? { pin: key, type: 2 } : { pin: key, type: 1, time });
  } catch (err) {
    console.error("Error pinning message:", err);
    reply(`❌ ${err.toString()}`);
  }
};

export default () => ({
  cmd: ["pin", "unpin"],
  desc: "Pin or unpin a message. Reply to it. Pin lasts 24h, 7d or 30d (default 24h).",
  usage: "pin [24h|7d|30d] | unpin  (reply to a pinned message)",
  handler,
});
