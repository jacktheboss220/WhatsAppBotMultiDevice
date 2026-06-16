import dotenv from "dotenv";
dotenv.config();

// Redis enabled when: USE_REDIS !== "false" AND at least one Redis env var is set
export const isRedisEnabled =
	process.env.USE_REDIS !== "false" &&
	!!(process.env.REDIS_URL || process.env.REDIS_HOST);

const mod = isRedisEnabled
	? await import("./redisCacheImpl.js")
	: await import("./memoryCache.js");

if (!isRedisEnabled) console.log("⚡ Cache: in-memory (Redis not configured)");

export const { getGroupMeta, setGroupMeta, delGroupMeta, checkRateLimit } = mod;
