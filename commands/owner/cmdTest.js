const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping, evv, isOwner } = msgInfoObj;

  // eval = full server access (env secrets, DB). Real owner only, and off unless explicitly enabled.
  if (process.env.ENABLE_EVAL !== "true") {
    return sendMessageWTyping(
      from,
      { text: "❌ Disabled. Set ENABLE_EVAL=true to use it." },
      { quoted: msg },
    );
  }
  if (!isOwner) {
    return sendMessageWTyping(from, { text: "❌ Owner only." }, { quoted: msg });
  }

  if (args.length === 0) {
    return sendMessageWTyping(from, { text: `❌ empty query!` }, { quoted: msg });
  }
  try {
    // oxlint-disable-next-line no-eval -- gated by ENABLE_EVAL + isOwner above
    let resultTest = eval(evv);
    if (typeof resultTest === "object")
      sendMessageWTyping(from, { text: JSON.stringify(resultTest) }, { quoted: msg });
    else sendMessageWTyping(from, { text: resultTest.toString() }, { quoted: msg });
  } catch (err) {
    sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
  }
};

export default () => ({
  cmd: ["test", "code"],
  desc: "Run a piece of code to test it.",
  usage: "test | code",
  handler,
});
