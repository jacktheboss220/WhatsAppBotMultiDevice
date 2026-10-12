const handler = async (sock, msg, from) => {
  try {
    await sock.groupLeave(from);
  } catch {
    console.log("Error");
  }
};

export default () => ({
  cmd: ["removebot"],
  desc: "Make the bot leave this group.",
  usage: "removebot",
  handler,
});
