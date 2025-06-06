require("dotenv").config();
const myNumber = process.env.MY_NUMBER;

const logOwner = (sock, mess, msg) => {
	if (!myNumber) {
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

	sock.sendMessage(myNumber + "@s.whatsapp.net", message);
};

module.exports = logOwner;
