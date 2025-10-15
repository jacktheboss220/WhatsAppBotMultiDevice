require("dotenv").config();

const { resetAuthentication, cleanupStaleSessions, emergencyCleanup } = require("../../functions/systemCleanup");
const fs = require("fs");
const path = require("path");
const myNumber = [
	process.env.MY_NUMBER.split(",")[0] + "@s.whatsapp.net",
	process.env.MY_NUMBER.split(",")[1] + "@lid",
];

const handler = async (sock, msg, from, args, { sendMessageWTyping, isOwner, senderJid }) => {
	if (!myNumber.includes(senderJid) && !isOwner) {
		return sendMessageWTyping(from, { text: "```❌ Only the bot owner can use this command```" }, { quoted: msg });
	}

	const action = args[0]?.toLowerCase();

	if (action === "reset") {
		await sendMessageWTyping(
			from,
			{
				text: "```⚠️ Resetting authentication... You will need to scan QR code again!```",
			},
			{ quoted: msg }
		);

		resetAuthentication();

		await sendMessageWTyping(
			from,
			{
				text: "```✅ Authentication reset complete. Restart the bot and scan QR code.```",
			},
			{ quoted: msg }
		);

		// Exit process to force restart
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	} else if (action === "conflict") {
		await sendMessageWTyping(
			from,
			{
				text: "```🔧 Resolving session conflicts...\nThis will clear conflict-causing sessions and restart the bot.```",
			},
			{ quoted: msg }
		);

		// Enhanced cleanup for session conflicts
		setTimeout(async () => {
			try {
				const authDir = path.join(__dirname, "..", "..", "baileys_auth_info");

				if (fs.existsSync(authDir)) {
					const files = fs.readdirSync(authDir);

					// Remove specific conflict-causing files
					const conflictFiles = files.filter(
						(file) => file.startsWith("sender-key-") || file.startsWith("pre-key-")
					);

					conflictFiles.forEach((file) => {
						try {
							fs.unlinkSync(path.join(authDir, file));
							console.log(`Removed conflict file: ${file}`);
						} catch (err) {
							console.error(`Failed to remove ${file}:`, err.message);
						}
					});

					console.log(`🧹 Removed ${conflictFiles.length} potential conflict files`);
				}

				// Restart the process
				console.log("🔄 Restarting to resolve conflicts...");
				process.exit(0);
			} catch (error) {
				console.error("Error during conflict resolution:", error);
				process.exit(1);
			}
		}, 3000);
	} else if (action === "clean") {
		await sendMessageWTyping(
			from,
			{
				text: "```🧹 Cleaning up stale session files...```",
			},
			{ quoted: msg }
		);

		cleanupStaleSessions();

		await sendMessageWTyping(
			from,
			{
				text: "```✅ Session cleanup completed```",
			},
			{ quoted: msg }
		);
	} else {
		const helpText = `
\`\`\`🔧 Session Management Commands:

${process.env.PREFIX}session clean - Clean up old session files
${process.env.PREFIX}session conflict - Resolve session conflicts (restarts bot)
${process.env.PREFIX}session reset - Reset authentication (requires QR scan)

⚠️ Use 'reset' only if experiencing persistent connection issues.
💡 Use 'conflict' if getting "Stream Errored (conflict)" messages.
\`\`\``;

		await sendMessageWTyping(from, { text: helpText }, { quoted: msg });
	}
};

module.exports.command = () => ({
	cmd: ["session"],
	desc: "Manage bot session and authentication",
	usage: "session <clean|conflict|reset>",
	handler,
});
