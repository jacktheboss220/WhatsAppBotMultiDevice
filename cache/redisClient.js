import { createClient } from "redis";

let client = null;
let connected = false;

const getRedisClient = async () => {
	if (client && connected) return client;

	client = createClient(
		process.env.REDIS_URL
			? {
					url: process.env.REDIS_URL,
					socket: { reconnectStrategy: (r) => Math.min(r * 500, 5000) },
			  }
			: {
					username: process.env.REDIS_USERNAME || "default",
					password: process.env.REDIS_PASSWORD,
					socket: {
						host: process.env.REDIS_HOST,
						port: parseInt(process.env.REDIS_PORT || "6379"),
						reconnectStrategy: (r) => Math.min(r * 500, 5000),
						tls: process.env.REDIS_TLS === "true" ? {} : undefined,
					},
			  }
	);

	client.on("error", (err) => console.error("Redis error:", err.message));
	client.on("reconnecting", () => console.log("Redis reconnecting..."));
	client.on("ready", () => { connected = true; });
	client.on("end", () => { connected = false; });

	await client.connect();
	connected = true;
	console.log("✅ Redis connected");
	return client;
};

export default getRedisClient;
