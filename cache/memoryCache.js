import NodeCache from "node-cache";

const GROUP_META_TTL = 10 * 60;
const RATE_LIMIT_WINDOW = 5;

const gmCache = new NodeCache({ stdTTL: GROUP_META_TTL, checkperiod: 120 });
const rlCache = new NodeCache({ stdTTL: RATE_LIMIT_WINDOW, checkperiod: 5 });

export const getGroupMeta = async (jid) => gmCache.get(`gm:${jid}`) ?? null;

export const setGroupMeta = async (jid, metadata) => {
	gmCache.set(`gm:${jid}`, metadata, GROUP_META_TTL);
};

export const delGroupMeta = async (jid) => {
	gmCache.del(`gm:${jid}`);
};

export const checkRateLimit = async (senderJid, command, limit = 3) => {
	const key = `rl:${senderJid}:${command}`;
	const current = rlCache.get(key);
	if (current === undefined) {
		rlCache.set(key, 1, RATE_LIMIT_WINDOW);
		return true;
	}
	const ttlMs = rlCache.getTtl(key);
	const remainingSecs = ttlMs ? Math.max(1, Math.ceil((ttlMs - Date.now()) / 1000)) : RATE_LIMIT_WINDOW;
	rlCache.set(key, current + 1, remainingSecs);
	return current + 1 <= limit;
};
