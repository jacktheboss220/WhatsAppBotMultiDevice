import mdClient from "../db/client.js";

const chatLogs = mdClient.db("MyBotDataDB").collection("ChatLogs");

(async () => {
  try {
    await chatLogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
    await chatLogs.createIndex({ groupJid: 1, timestamp: 1 });
  } catch (e) {
    console.error("[chatLogger] index error:", e.message);
  }
})();

export const saveChatMessage = async (
  groupJid,
  senderJid,
  senderName,
  text,
  replyTo = null,
  mentions = [],
) => {
  try {
    await chatLogs.insertOne({
      groupJid,
      sender: senderJid,
      senderName: senderName || "",
      text,
      replyTo,
      mentions,
      timestamp: new Date(),
    });
  } catch (e) {
    console.error("[chatLogger] save error:", e.message);
  }
};

// `limit` keeps the newest N messages (returned oldest-first); 0 = no cap.
export const getChatMessages = async (groupJid, hours = 24, limit = 0) => {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const rows = await chatLogs
      .find({ groupJid, timestamp: { $gte: since } })
      .sort({ timestamp: limit ? -1 : 1 })
      .limit(limit)
      .toArray();
    return limit ? rows.reverse() : rows;
  } catch (e) {
    console.error("[chatLogger] fetch error:", e.message);
    return [];
  }
};

const dayLabel = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
});

// Log rows → prompt lines "Name [replying to X: "..."]: text". dayHeaders adds "--- Mon 26 Oct ---"
// markers when the day changes, for multi-day windows.
export const formatChatLines = (logs, { dayHeaders = false } = {}) => {
  let day = "";
  return logs.map((m) => {
    const name = m.senderName || m.sender.split("@")[0];
    const replyPart = m.replyTo
      ? ` [replying to ${m.replyTo.senderName || m.replyTo.sender.split("@")[0]}: "${m.replyTo.text}"]`
      : "";
    let text = m.text;
    for (const mention of m.mentions || []) {
      const num = mention.jid.split("@")[0].split(":")[0];
      text = text.replace(new RegExp(`@${num}`, "g"), `@${mention.name}`);
    }
    let header = "";
    if (dayHeaders) {
      const d = dayLabel.format(m.timestamp);
      if (d !== day) {
        day = d;
        header = `--- ${d} ---\n`;
      }
    }
    return `${header}${name}${replyPart}: ${text}`;
  });
};
