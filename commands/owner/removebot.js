const handler = async (sock, msg, from, args, msgInfoObj) => {
	try {
		await sock.groupLeave(from);
	} catch (err) {
		console.log("Error");
	}
};

export default () => ({
	cmd: ["removebot"],
	desc: "Make the bot leave this group.",
	usage: "removebot",
	handler,
});
