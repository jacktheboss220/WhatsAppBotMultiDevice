require("dotenv").config();
const myNumber = [
	process.env.MY_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.MY_NUMBER.split(",")[1] + "@lid",
];

const logOwner = (sock, mess, msg) => {
	if (myNumber.length === 0) {
		console.error("MY_NUMBER is not set in the environment variables.");
		return;
	}

	const message = {
		text: mess,
		mentions: [],
	};

	const isMentioned = msg?.message?.extendedTextMessage;
	if (msg && isMentioned && isMentioned.contextInfo && isMentioned.contextInfo.mentionedJid) {
		const mentionedJid = isMentioned.contextInfo.mentionedJid;
		message.mentions = mentionedJid;
	}

	sock.sendMessage(myNumber[0], message);
};

module.exports = logOwner;
