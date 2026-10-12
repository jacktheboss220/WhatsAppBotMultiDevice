import NodeCache from "node-cache";
import getRedisClient from "./redisClient.js";
import { isRedisEnabled } from "./redisCache.js";

// Baileys' userDevicesCache (which devices each user has; needed for every group send).
// Memory first, Redis behind it so the cache survives restarts. mget/mset are required: without
// mget Baileys does one get() per member, i.e. ~900 sequential Redis round trips in a big group.
// Redis down/unconfigured => plain in-memory behaviour, never an error.
const TTL = 24 * 60 * 60;
const mem = new NodeCache({ stdTTL: TTL, checkperiod: 600, useClones: false });
const rkey = (k) => `ud:${k}`;

const redis = async () => {
  if (!isRedisEnabled) return null;
  try {
    return await getRedisClient();
  } catch {
    return null;
  }
};

const userDevicesCache = {
  get: async (key) => (await userDevicesCache.mget([key]))[key],

  mget: async (keys) => {
    const out = {};
    const missing = [];
    for (const k of keys) {
      const v = mem.get(k);
      if (v !== undefined) out[k] = v;
      else missing.push(k);
    }
    const r = missing.length && (await redis());
    if (r) {
      try {
        const vals = await r.mGet(missing.map(rkey));
        missing.forEach((k, i) => {
          if (vals[i]) {
            out[k] = JSON.parse(vals[i]);
            mem.set(k, out[k]);
          }
        });
      } catch {
        // Redis hiccup: treat as a miss, Baileys re-fetches from WhatsApp
      }
    }
    return out;
  },

  set: async (key, value) => userDevicesCache.mset([{ key, value }]),

  mset: async (entries) => {
    for (const { key, value } of entries) mem.set(key, value);
    const r = await redis();
    if (!r) return;
    try {
      const multi = r.multi();
      for (const { key, value } of entries) multi.setEx(rkey(key), TTL, JSON.stringify(value));
      await multi.exec();
    } catch {
      // non-fatal
    }
  },

  del: async (key) => {
    mem.del(key);
    const r = await redis();
    if (r) await r.del(rkey(key)).catch(() => {});
  },

  // Returns the number of Redis keys removed (memory is flushed too).
  flushAll: async () => {
    mem.flushAll();
    const r = await redis();
    if (!r) return 0;
    let n = 0;
    for await (const keys of r.scanIterator({ MATCH: "ud:*", COUNT: 500 })) {
      for (const k of [].concat(keys)) {
        await r.del(k);
        n++;
      }
    }
    return n;
  },
};

export default userDevicesCache;
