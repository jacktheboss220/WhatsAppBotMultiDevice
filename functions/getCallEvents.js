const logOwner = require("./getOwnerSend");

const getCallEvent = async (sock, call) => {
	// console.log(`Received call event:`, call);

	for (const c of call) {
		if (c.status === "offer") {
			// console.log(`Received call event:`, call);
			// logOwner(sock, `Incoming call from ${c.from}`);
			await sock
				.rejectCall(c.id, c.from)
				.then(() => {
					logOwner(sock, `Call from ${c.from} is ringing and rejected.`);
				})
				.catch((err) => {
					console.error(`Failed to reject call from ${c.from}:`, err);
				});
		}
		if (c.status === "ringing") {
			// console.log(`Call is ringing from ${c.from}`);
		}
		if (c.status === "terminated") {
			// console.log(`Call terminated from ${c.from}`);
		}
		if (c.status === "reject") {
			// console.log(`Call reject from ${c.from}`);
		}
	}
};

module.exports = getCallEvent;
