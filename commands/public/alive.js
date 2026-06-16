import mdClient from "../../db/client.js";
import { isRedisEnabled } from "../../cache/redisCache.js";
import getRedisClient from "../../cache/redisClient.js";
import { isBullReady } from "../../queue/bullQueue.js";

async function checkMongo() {
	try {
		await mdClient.db("admin").command({ ping: 1 });
		return true;
	} catch {
		return false;
	}
}

async function checkRedis() {
	try {
		const r = await getRedisClient();
		await r.ping();
		return true;
	} catch {
		return false;
	}
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping, startTime, updateName } = msgInfoObj;

	const uptime = process.uptime();
	const hours = Math.floor(uptime / 3600);
	const minutes = Math.floor((uptime % 3600) / 60);
	const seconds = Math.floor(uptime % 60);
	const simpleUptime = `${hours}h ${minutes}m ${seconds}s`;

	const diff = process.hrtime(startTime);
	const responseTime = (diff[0] * 1e9 + diff[1]) / 1e6;
	const responseTimeInSeconds = responseTime / 1000;

	const memoryUsage = process.memoryUsage();
	const usedMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);

	const [mongoOk, redisResult] = await Promise.all([
		checkMongo(),
		isRedisEnabled ? checkRedis() : Promise.resolve(null),
	]);

	const bullOk = isBullReady();

	const st = (ok) => (ok === null ? "⚪" : ok ? "🟢" : "🔴");

	const response =
		`*👋🏻 Hello ${updateName}*\n\n` +
		`*🎾 Eva is Online!*\n` +
		`*🟢 Response:* ${responseTime >= 1000 ? `${responseTimeInSeconds.toFixed(2)}s` : `${responseTime.toFixed(2)}ms`}\n` +
		`*⏱️ Uptime:* ${simpleUptime}\n` +
		`*🧠 RAM:* ${usedMB} MB\n\n` +
		`*── Connections ──*\n` +
		`${st(mongoOk)} *MongoDB*\n` +
		`${st(redisResult)} *Redis*${redisResult === null ? " _(disabled)_" : ""}\n` +
		`${st(bullOk)} *BullMQ Queue*\n\n` +
		`*🛠️ Node.js:* ${process.version}`;

	return sendMessageWTyping(from, { text: response }, { quoted: msg });
};

export default () => ({
	cmd: ["a", "alive", "ping"],
	desc: "Check if bot is alive",
	usage: "alive | ping | a",
	handler,
});
