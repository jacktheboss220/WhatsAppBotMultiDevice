import { createClient } from "redis";

let client = null;

// Never await a connect here: with a reconnectStrategy, connect() keeps retrying and never
// rejects while Redis is down, which used to hang every group message. Connect once in the
// background and fail fast (callers fall back to NodeCache) until the client is ready.
const getRedisClient = async () => {
	if (client?.isReady) return client;

	if (!client) {
		client = createClient(
			process.env.REDIS_URL
				? {
						url: process.env.REDIS_URL,
						socket: { connectTimeout: 3000, reconnectStrategy: (r) => Math.min(r * 500, 5000) },
				  }
				: {
						username: process.env.REDIS_USERNAME || "default",
						password: process.env.REDIS_PASSWORD,
						socket: {
							host: process.env.REDIS_HOST,
							port: parseInt(process.env.REDIS_PORT || "6379"),
							connectTimeout: 3000,
							reconnectStrategy: (r) => Math.min(r * 500, 5000),
							tls: process.env.REDIS_TLS === "true" ? {} : undefined,
						},
				  }
		);
		client.on("error", (err) => console.error("Redis error:", err.message));
		client.on("reconnecting", () => console.log("Redis reconnecting..."));
		client.on("ready", () => console.log("✅ Redis connected"));
		client.connect().catch((err) => console.error("Redis connect failed:", err.message));
	}

	throw new Error("Redis not ready");
};

export default getRedisClient;
