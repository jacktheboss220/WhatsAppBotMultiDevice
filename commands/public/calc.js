import { askHeavy } from "../../utils/chat.js";

const MAX_NATURAL_CHARS = 200;
const ALLOWED = /^[0-9+\-*/().% \t]+$/;

function safeEval(expr) {
  if (!ALLOWED.test(expr)) throw new Error("Invalid characters in expression");
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr})`)();
}

const EXPR_SYSTEM = `Turn the user's math request into ONE arithmetic expression using only digits and + - * / ( ) . and ** for powers (use **0.5 for a square root).
Write percentages as multiplication, e.g. 15% of 2400 → 2400*15/100. Convert units yourself, e.g. 2 km in miles → 2*0.621371.
Reply with only the expression. If the request is not a calculation, reply NONE.`;

// Words → expression. The model never computes the answer: its output must pass the same
// ALLOWED check and is evaluated by safeEval like anything the user typed.
const toExpression = async (text) => {
  const out = (
    await askHeavy(
      [
        { role: "system", content: EXPR_SYSTEM },
        { role: "user", content: text },
      ],
      { maxTokens: 60 },
    )
  )
    .replace(/[`=]/g, "")
    .trim();
  if (!ALLOWED.test(out)) throw new Error("model did not return an expression");
  return out;
};

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping, prefix, evv } = msgInfoObj;

  if (!args[0])
    return sendMessageWTyping(
      from,
      { text: `❌ Provide an expression.\n_Usage: ${prefix}calc 25 * 4 + 10_` },
      { quoted: msg },
    );

  const expr = evv.trim();

  try {
    // plain maths stays local and free; only text the strict check rejects goes to the model
    let interpreted = null;
    if (!ALLOWED.test(expr)) {
      if (expr.length > MAX_NATURAL_CHARS) throw new Error("too long");
      interpreted = await toExpression(expr);
    }
    const result = safeEval(interpreted ?? expr);

    if (typeof result !== "number" || !isFinite(result))
      return sendMessageWTyping(
        from,
        { text: `❌ Invalid result. Check your expression.` },
        { quoted: msg },
      );

    const formatted = Number.isInteger(result)
      ? result.toLocaleString()
      : result.toPrecision(10).replace(/\.?0+$/, "");
    sendMessageWTyping(
      from,
      {
        text: `🧮 *Calculator*\n\n\`${expr}\`\n${interpreted ? `_as_ \`${interpreted}\`\n` : ""}= *${formatted}*`,
      },
      { quoted: msg },
    );
  } catch {
    sendMessageWTyping(from, { text: `❌ Invalid expression: \`${expr}\`` }, { quoted: msg });
  }
};

export default () => ({
  cmd: ["calc", "calculate"],
  desc: "Solve a math expression or a plain-English calculation.",
  usage: "calc <expression> | calc 15% of 2400",
  handler,
});
