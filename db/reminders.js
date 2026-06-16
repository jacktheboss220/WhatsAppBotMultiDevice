import mdClient from "./client.js";

const reminders = mdClient.db("MyBotDataDB").collection("Reminders");

// compound index: scheduler query hits this directly, no collection scan
reminders.createIndex({ reminded: 1, remindAt: 1 }, { background: true }).catch(() => {});

export const insertReminder = (data) => reminders.insertOne(data);

export const getDueReminders = () => reminders.find({ reminded: false, remindAt: { $lte: new Date() } }).toArray();

export const markReminded = (id) =>
	reminders.updateOne({ _id: id }, { $set: { reminded: true, remindedAt: new Date() } });

export const getUserReminders = (jid) =>
	reminders
		.find({ jid, reminded: false, remindAt: { $gt: new Date() } })
		.sort({ remindAt: 1 })
		.toArray();

export const deleteReminder = (id, jid) => reminders.deleteOne({ _id: id, jid });

export const scheduleNextRepeat = (id, currentRemindAt, repeat) => {
	const ms = repeat === "weekly" ? 7 * 86_400_000 : 86_400_000; // weekly or daily
	const nextRemindAt = new Date(new Date(currentRemindAt).getTime() + ms);
	return reminders.updateOne({ _id: id }, { $set: { remindAt: nextRemindAt } });
};
