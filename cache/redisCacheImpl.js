import getRedisClient from "./redisClient.js";

const GROUP_META_TTL = 10 * 60;
const RATE_LIMIT_WINDOW = 5;

export const getGroupMeta = async (jid) => {
	try {
		const r = await getRedisClient();
		const val = await r.get(`gm:${jid}`);
		return val ? JSON.parse(val) : null;
	} catch {
		return null;
	}
};

export const setGroupMeta = async (jid, metadata) => {
	try {
		const r = await getRedisClient();
		await r.setEx(`gm:${jid}`, GROUP_META_TTL, JSON.stringify(metadata));
	} catch {
		// non-fatal
	}
};

export const delGroupMeta = async (jid) => {
	try {
		const r = await getRedisClient();
		await r.del(`gm:${jid}`);
	} catch {
		// non-fatal
	}
};

export const checkRateLimit = async (senderJid, command, limit = 3) => {
	try {
		const r = await getRedisClient();
		const key = `rl:${senderJid}:${command}`;
		const count = await r.incr(key);
		if (count === 1) await r.expire(key, RATE_LIMIT_WINDOW);
		return count <= limit;
	} catch {
		return true;
	}
};
