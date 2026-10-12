import getRedisClient from "./redisClient.js";

const GROUP_META_TTL = 60 * 60;
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

// Only our own prefixes: the same Redis may also hold BullMQ keys, so never FLUSHDB.
export const delByPrefix = async (prefix) => {
  const r = await getRedisClient();
  let n = 0;
  for await (const keys of r.scanIterator({ MATCH: `${prefix}*`, COUNT: 500 })) {
    for (const k of [].concat(keys)) {
      await r.del(k);
      n++;
    }
  }
  return n;
};

export const clearGroupMeta = () => delByPrefix("gm:");

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
