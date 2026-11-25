import { insertReminder, getUserReminders, deleteReminder } from "../../db/reminders.js";
import { askHeavy } from "../../utils/chat.js";

const MAX_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PENDING = 20; // per user, so nobody can flood the DB or a group with reminders
const UNITS = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
const REPEATS = ["daily", "weekly"];

const pad = (n) => String(n).padStart(2, "0");

// "30m", "2h", "3d", "1w" → ms, or null
const parseRelative = (str) => {
  const m = str?.match(/^(\d+)(m|h|d|w)$/i);
  if (!m) return null;
  const ms = parseInt(m[1]) * UNITS[m[2].toLowerCase()];
  return ms > 0 && ms <= MAX_MS ? ms : null;
};

// "1:30PM", "9AM", "13:30" → Date in IST, or null
const parseSpecificTime = (str) => {
  const m12 = str?.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
  const m24 = str?.match(/^(\d{1,2}):(\d{2})$/);
  let h, min;
  if (m12) {
    h = parseInt(m12[1]);
    min = parseInt(m12[2] || "0");
    const pm = m12[3].toLowerCase() === "pm";
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  } else if (m24) {
    h = parseInt(m24[1]);
    min = parseInt(m24[2]);
  } else return null;

  if (h > 23 || min > 59) return null;

  const now = new Date();
  // today's date in IST as YYYY-MM-DD
  const istDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  // build ISO with explicit IST offset so JS parses correctly
  let target = new Date(`${istDate}T${pad(h)}:${pad(min)}:00+05:30`);
  // if that time already passed today, move to tomorrow
  if (target <= now) target = new Date(target.getTime() + 86_400_000);
  return target;
};

const formatIST = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

const MAX_NATURAL_CHARS = 300;

const nowPrompt = () =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
    hour12: false,
  }).format(new Date());

const NATURAL_SYSTEM = `You turn a reminder request into JSON. Reply with ONLY one JSON object, no prose:
{"at":"YYYY-MM-DDTHH:mm","text":"...","repeat":"daily"|"weekly"|null}
- "at" is the first time to fire, in IST (24-hour), and must be in the future. A time of day with no date means its next occurrence.
- "text" is what to remind about, in the user's own language, without the time words.
- "repeat" is only set when the user asks for it ("every day", "every Monday").
If no time can be determined, reply {"error":true}.`;

// Free-form request ("tomorrow evening call mom") → { remindAt, text, repeat } or null.
// Nemotron has no structured-output mode, so the JSON is extracted and validated here.
const parseNatural = async (input) => {
  let raw;
  try {
    raw = await askHeavy(
      [
        { role: "system", content: NATURAL_SYSTEM },
        { role: "user", content: `Current time (IST): ${nowPrompt()}\nRequest: ${input}` },
      ],
      { maxTokens: 150 },
    );
  } catch (err) {
    console.error("[remind] natural parse failed:", err.message);
    return null;
  }
  let data;
  try {
    data = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0]);
  } catch {
    return null;
  }
  const at = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data?.at)
    ? new Date(`${data.at}:00+05:30`)
    : null;
  const text = typeof data?.text === "string" ? data.text.trim() : "";
  if (!at || isNaN(at) || at <= new Date() || !text) return null;
  return { remindAt: at, text, repeat: REPEATS.includes(data.repeat) ? data.repeat : null };
};

const HELP_TEXT =
  `*Reminder Command*\n\n` +
  `*Relative:* \`remind <time> <message>\`\n` +
  `*Specific:* \`remind 1:30PM <message>\`\n` +
  `*Repeat:* add \`repeat daily\` or \`repeat weekly\`\n` +
  `*List:* \`remind list\`\n` +
  `*Cancel:* \`remind cancel <number>\`\n` +
  `*Or just say it:* \`remind tomorrow 6pm call mom\`\n\n` +
  `*Time formats:*\n` +
  `• \`10m\` \`2h\` \`3d\` \`1w\` _(max 7 days)_\n` +
  `• \`1:30PM\` \`9AM\` \`13:30\` _(IST, today or tomorrow)_\n\n` +
  `*Examples:*\n` +
  `\`remind 30m call mom\`\n` +
  `\`remind 9:00AM standup repeat daily\`\n` +
  `\`remind 1w project review repeat weekly\``;

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { senderJid, sendMessageWTyping } = msgInfoObj;

  if (!args[0]) return sendMessageWTyping(from, { text: HELP_TEXT }, { quoted: msg });

  // remind list
  if (args[0] === "list") {
    const pending = await getUserReminders(senderJid);
    if (!pending.length)
      return sendMessageWTyping(from, { text: "No pending reminders." }, { quoted: msg });
    const lines = pending
      .map((r, i) => {
        const repeatNote = r.repeat ? ` _(repeats ${r.repeat})_` : "";
        return `*${i + 1}.* ${r.text}${repeatNote}\n    ⏰ ${formatIST(r.remindAt)} IST`;
      })
      .join("\n\n");
    return sendMessageWTyping(
      from,
      { text: `*Your pending reminders:*\n\n${lines}` },
      { quoted: msg },
    );
  }

  // remind cancel <n>
  if (args[0] === "cancel") {
    const n = parseInt(args[1]);
    if (!n || n < 1)
      return sendMessageWTyping(
        from,
        { text: "Usage: `remind cancel <number>`\nSee yours with `remind list`." },
        { quoted: msg },
      );
    const pending = await getUserReminders(senderJid);
    const target = pending[n - 1];
    if (!target)
      return sendMessageWTyping(
        from,
        { text: `❌ No reminder #${n}. You have ${pending.length} pending.` },
        { quoted: msg },
      );
    await deleteReminder(target._id, senderJid);
    return sendMessageWTyping(from, { text: `✅ Cancelled: _${target.text}_` }, { quoted: msg });
  }

  // strip "repeat <interval>" from args before parsing text
  const repeatIdx = args.indexOf("repeat");
  const repeatVal = repeatIdx !== -1 ? args[repeatIdx + 1]?.toLowerCase() : null;
  const cleanArgs =
    repeatIdx !== -1
      ? [
          ...args.slice(0, repeatIdx),
          ...args.slice(repeatIdx + (REPEATS.includes(repeatVal) ? 2 : 1)),
        ]
      : args;

  // checked before parsing so a full queue never spends an LLM call
  const pendingCount = (await getUserReminders(senderJid)).length;
  if (pendingCount >= MAX_PENDING)
    return sendMessageWTyping(
      from,
      {
        text: `❌ You already have ${pendingCount} pending reminders (max ${MAX_PENDING}). Cancel some with \`remind cancel <number>\`.`,
      },
      { quoted: msg },
    );

  // strict syntax first: free, instant, no API call
  const timeStr = cleanArgs[0];
  const specificTime = parseSpecificTime(timeStr);
  const relativeMs = specificTime === null ? parseRelative(timeStr) : null;

  let remindAt, text, repeat;
  if (specificTime || relativeMs) {
    text = cleanArgs.slice(1).join(" ").trim();
    if (!text)
      return sendMessageWTyping(
        from,
        { text: "❌ Reminder message can't be empty.\nExample: `remind 30m call mom`" },
        { quoted: msg },
      );
    remindAt = specificTime ?? new Date(Date.now() + relativeMs);
    repeat = repeatVal && REPEATS.includes(repeatVal) ? repeatVal : null;
  } else {
    const input = args.join(" ");
    const parsed = input.length <= MAX_NATURAL_CHARS ? await parseNatural(input) : null;
    if (!parsed)
      return sendMessageWTyping(
        from,
        {
          text: `❌ Couldn't understand the time in \`${input.slice(0, 60)}\`.\nUse: \`10m\` \`2h\` \`3d\` \`1w\`, \`1:30PM\` \`9AM\` \`13:30\` (IST), or e.g. \`remind tomorrow 6pm call mom\`.`,
        },
        { quoted: msg },
      );
    ({ remindAt, text, repeat } = parsed);
    if (remindAt - Date.now() > MAX_MS)
      return sendMessageWTyping(
        from,
        { text: "❌ Reminders can be at most 7 days away." },
        { quoted: msg },
      );
  }

  await insertReminder({
    jid: senderJid,
    from,
    text,
    remindAt,
    reminded: false,
    repeat: repeat ?? null,
    createdAt: new Date(),
  });

  const repeatNote = repeat ? `\n🔁 Repeats ${repeat}` : "";
  return sendMessageWTyping(
    from,
    {
      text: `✅ *Reminder set!*\n\n📝 _${text}_\n⏰ ${formatIST(remindAt)} IST${repeatNote}`,
    },
    { quoted: msg },
  );
};

export default () => ({
  cmd: ["remind", "reminder"],
  desc: "Set a reminder (up to 1 week), with optional repeat. Times are in IST; plain-English times work too.",
  usage:
    "remind <10m|2h|1:30PM|tomorrow 6pm> <message> [repeat daily|weekly] | remind list | remind cancel <n>",
  handler,
});
