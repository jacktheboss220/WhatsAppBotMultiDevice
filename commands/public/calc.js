const ALLOWED = /^[0-9+\-*/().% \t]+$/;

function safeEval(expr) {
	if (!ALLOWED.test(expr)) throw new Error("Invalid characters in expression");
	// eslint-disable-next-line no-new-func
	return Function(`"use strict"; return (${expr})`)();
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, prefix, evv } = msgInfoObj;

	if (!args[0])
		return sendMessageWTyping(from, { text: `❌ Provide an expression.\n_Usage: ${prefix}calc 25 * 4 + 10_` }, { quoted: msg });

	const expr = evv.trim();

	try {
		const result = safeEval(expr);

		if (typeof result !== "number" || !isFinite(result))
			return sendMessageWTyping(from, { text: `❌ Invalid result. Check your expression.` }, { quoted: msg });

		const formatted = Number.isInteger(result) ? result.toLocaleString() : result.toPrecision(10).replace(/\.?0+$/, "");
		sendMessageWTyping(from, { text: `🧮 *Calculator*\n\n\`${expr}\`\n= *${formatted}*` }, { quoted: msg });
	} catch {
		sendMessageWTyping(from, { text: `❌ Invalid expression: \`${expr}\`` }, { quoted: msg });
	}
};

export default () => ({
	cmd: ["calc", "calculate"],
	desc: "Solve a math expression.",
	usage: "calc <expression>",
	handler,
});
