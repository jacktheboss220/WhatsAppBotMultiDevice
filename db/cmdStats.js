import mdClient from "./client.js";

// One doc per (command, group). Overall numbers are aggregated on read.
const cmdStats = mdClient.db("MyBotDataDB").collection("CmdStats");

const recordCommand = (cmd, groupJid) =>
	cmdStats
		.updateOne(
			{ _id: `${cmd}|${groupJid || "DM"}` },
			{ $inc: { count: 1 }, $set: { cmd, group: groupJid || "DM", last: new Date() } },
			{ upsert: true },
		)
		.catch((e) => console.error("[cmdStats error]", e.message));

// groupJid omitted => all groups + DMs. Returns [{ _id: cmd, count }] sorted desc.
const getCommandStats = (groupJid) =>
	cmdStats
		.aggregate([
			...(groupJid ? [{ $match: { group: groupJid } }] : []),
			{ $group: { _id: "$cmd", count: { $sum: "$count" } } },
			{ $sort: { count: -1 } },
		])
		.toArray();

export { recordCommand, getCommandStats };
