import dotenv from "dotenv";
dotenv.config();

import { cmdToText } from "../../utils/commandLoader.js";
import { askHeavy } from "../../utils/chat.js";

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const MAX_QUESTION_CHARS = 200;

const FIND_SYSTEM = `You match a user's request to bot commands. Commands are listed one per line as: name (aliases) - description. Usage.
Reply with at most 3 lines, best match first, each exactly: <name> | <one short sentence on how to use it for this request>
Use only names from the list. If nothing fits, reply NONE.`;

// Free-form question → up to 3 real commands. The model only picks names; each one is checked
// against the loaded list, so an invented command can never reach the user.
const findCommands = async (question, all) => {
  const list = all
    .map((c) => `${c.cmd[0]} (${c.cmd.slice(1).join(", ")}) - ${c.desc} Usage: ${c.usage}`)
    .join("\n");
  let raw;
  try {
    raw = await askHeavy(
      [
        { role: "system", content: `${FIND_SYSTEM}\n\nCommands:\n${list}` },
        { role: "user", content: question },
      ],
      { maxTokens: 200 },
    );
  } catch (err) {
    console.error("[help] command search failed:", err.message);
    return [];
  }
  const picks = [];
  for (const line of raw.split("\n")) {
    const [name, ...tip] = line.split("|");
    const cmd = all.find((c) =>
      c.cmd.includes(
        name
          .trim()
          .toLowerCase()
          .replace(/^[-/*]/, ""),
      ),
    );
    if (cmd && !picks.some((p) => p.cmd === cmd)) picks.push({ cmd, tip: tip.join("|").trim() });
  }
  return picks.slice(0, 3);
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
  let { isGroup, sendMessageWTyping, isOwner } = msgInfoObj;
  let prefix = process.env.PREFIX;

  const { publicCommands, groupCommands, adminCommands, ownerCommands, directCommands } =
    await cmdToText();

  if (args.length > 0) {
    const all = [...publicCommands, ...groupCommands, ...adminCommands, ...ownerCommands];
    const query = args[0].toLowerCase().replace(/^[-/]/, "");
    const found = args.length === 1 ? all.find((c) => c.cmd.includes(query)) : null;
    if (!found) {
      // not a command name: treat it as a question ("help how do I download a song")
      const question = args.join(" ");
      const visible = isOwner ? all : all.filter((c) => !ownerCommands.includes(c));
      const picks =
        question.length <= MAX_QUESTION_CHARS ? await findCommands(question, visible) : [];
      if (!picks.length) {
        return sendMessageWTyping(
          from,
          { text: `❌ No command found: *${query}*` },
          { quoted: msg },
        );
      }
      const text =
        `🔎 *Try:*\n\n` +
        picks
          .map(
            ({ cmd, tip }) =>
              `▸ *${prefix}${cmd.cmd[0]}*${tip ? `\n   ${tip}` : ""}\n   \`${prefix}${cmd.usage}\``,
          )
          .join("\n\n");
      return sendMessageWTyping(from, { text }, { quoted: msg });
    }
    const aliases = found.cmd
      .filter((c) => c !== found.cmd[0])
      .map((c) => `${prefix}${c}`)
      .join("  |  ");
    const text =
      `📖 *${prefix}${found.cmd[0]}*\n\n` +
      `*Description:* ${found.desc}\n` +
      `*Usage:* \`${prefix}${found.usage}\`` +
      (aliases ? `\n*Aliases:* ${aliases}` : "");
    return sendMessageWTyping(from, { text }, { quoted: msg });
  }

  const adminCmd = adminCommands.filter((cmd) => cmd.cmd.includes("admin"));
  const ownerCmd = ownerCommands.filter((cmd) => cmd.cmd.includes("owner"));

  const line = (c) => `▸ *${prefix}${c.cmd[0]}*${
    c.cmd.length > 1
      ? ` _(${c.cmd
          .slice(1)
          .map((a) => prefix + a)
          .join(", ")})_`
      : ""
  }
   ${c.desc}`;
  const section = (title, list) =>
    list.length
      ? `
*━━ ${title} ━━*
${list.map(line).join("\n\n")}
`
      : "";
  const footer = `
💡 _${prefix}help <command> for usage_
♥ buymeacoffee.com/jacktheboss220`;

  const help =
    `🤖 *Eʋα Bσƚ — Menu*
${readMore}` +
    section("🌐 PUBLIC", publicCommands) +
    section("👥 GROUP", groupCommands) +
    section("🛡️ ADMIN", adminCmd) +
    section("👑 OWNER", ownerCmd) +
    footer;

  const helpInDm =
    `🤖 *Eʋα Bσƚ — DM Menu*
` +
    section("💬 DM COMMANDS", directCommands) +
    footer;

  await sendMessageWTyping(from, {
    text: isGroup ? help : helpInDm,
  });
};

export default () => ({
  cmd: ["help", "menu"],
  desc: "Show this menu, details of one command, or find a command by asking.",
  usage: "help [command | what you want to do]",
  handler,
});
