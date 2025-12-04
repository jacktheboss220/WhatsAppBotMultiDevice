const handler = async (sock, msg, from, args, msgInfoObj) => {
	try {
		await sock.groupLeave(from);
	} catch (err) {
		console.log("Error");
	}
};

export default () => ({
	cmd: ["removebot"],
	desc: "Remove bot from group",
	usage: "removebot",
	handler,
});
