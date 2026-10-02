import mdClient from "./client.js";

const reminders = mdClient.db("MyBotDataDB").collection("Reminders");

// compound index: scheduler query hits this directly, no collection scan
reminders.createIndex({ reminded: 1, remindAt: 1 }, { background: true }).catch(() => {});

export const insertReminder = (data) => reminders.insertOne(data);

export const getDueReminders = () => reminders.find({ reminded: false, remindAt: { $lte: new Date() } }).toArray();

export const getUserReminders = (jid) =>
	reminders
		.find({ jid, reminded: false, remindAt: { $gt: new Date() } })
		.sort({ remindAt: 1 })
		.toArray();

export const deleteReminder = (id, jid) => reminders.deleteOne({ _id: id, jid });

// Next run strictly in the future. After downtime this SKIPS the missed occurrences instead of
// returning a time that is still in the past (which used to fire once per minute until caught up).
export const nextOccurrence = (current, repeat, now = Date.now()) => {
	const ms = repeat === "weekly" ? 7 * 86_400_000 : 86_400_000;
	let t = new Date(current).getTime() + ms;
	if (t <= now) t += (Math.floor((now - t) / ms) + 1) * ms;
	return new Date(t);
};

// Atomically take a due reminder BEFORE sending: marks it done (or moves a repeat to its next run).
// Only one caller can win, so overlapping scheduler runs or a failed follow-up write can't send it twice.
export const claimReminder = async (r) => {
	const update = r.repeat
		? { $set: { remindAt: nextOccurrence(r.remindAt, r.repeat) } }
		: { $set: { reminded: true, remindedAt: new Date() } };
	const res = await reminders.updateOne({ _id: r._id, reminded: false, remindAt: r.remindAt }, update);
	return res.modifiedCount === 1;
};

// A one-off reminder whose send failed goes back in the queue (caller limits attempts).
export const requeueReminder = (r, delayMs = 5 * 60_000) =>
	reminders.updateOne(
		{ _id: r._id },
		{ $set: { reminded: false, remindAt: new Date(Date.now() + delayMs) }, $inc: { attempts: 1 } },
	);
