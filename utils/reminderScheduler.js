import { getDueReminders, claimReminder, requeueReminder } from "../db/reminders.js";
import { getMemberData } from "../db/members.js";
import { getSock } from "../core/socketRef.js";

const MAX_ATTEMPTS = 3;

const formatIST = (date) =>
	new Intl.DateTimeFormat("en-IN", {
		timeZone: "Asia/Kolkata",
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	}).format(date);

let running = false; // a slow run must not overlap the next 60 s tick

export const checkReminders = async () => {
	if (running) return;
	const sock = getSock();
	if (!sock?.user) return; // bot not ready, retry next tick

	running = true;
	try {
		let due;
		try {
			due = await getDueReminders();
		} catch (err) {
			console.error("[REMINDER] DB fetch error:", err.message);
			return;
		}

		for (const reminder of due) {
			try {
				// claim first: if this returns false another run already took it
				if (!(await claimReminder(reminder))) continue;

				// a blocked member's reminders are dropped, not delivered
				const sender = await getMemberData(reminder.jid);
				if (sender?.isBlock) continue;

				const isGroup = reminder.from !== reminder.jid;
				const text = `⏰ *Reminder!*\n\n📝 ${reminder.text}\n\n_Set for ${formatIST(reminder.remindAt)} IST_`;

				try {
					if (isGroup) {
						await sock.sendMessage(reminder.from, { text, mentions: [reminder.jid] });
					} else {
						await sock.sendMessage(reminder.from, { text });
					}
				} catch (err) {
					console.error(`[REMINDER] Send failed for ${reminder._id}:`, err.message);
					// repeats simply skip this occurrence; one-offs retry a few times
					if (!reminder.repeat && (reminder.attempts || 0) < MAX_ATTEMPTS) await requeueReminder(reminder);
				}
			} catch (err) {
				console.error(`[REMINDER] Error handling ${reminder._id}:`, err.message);
			}
		}
	} finally {
		running = false;
	}
};

let _interval = null;

export const startReminderScheduler = () => {
	if (_interval) return;
	_interval = setInterval(checkReminders, 60_000); // poll every minute
	checkReminders(); // immediate check catches any missed during downtime
	console.log("[REMINDER] Scheduler started");
};
