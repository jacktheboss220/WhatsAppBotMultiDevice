import { Queue, Worker } from "bullmq";
import { getSock } from "../core/socketRef.js";
import { readFileEfficiently } from "../utils/file.js";
import crypto from "crypto";

const QUEUE_NAME = "wa-messages";
const MEDIA_TYPES = ["sticker", "image", "audio", "video", "document"];

// In-memory buffer store — Buffers stay in process, only UUID key goes to Redis
const bufferRefs = new Map();

function getConn() {
	if (process.env.REDIS_URL) {
		const u = new URL(process.env.REDIS_URL);
		return {
			host: u.hostname,
			port: parseInt(u.port) || 6379,
			username: u.username || "default",
			password: decodeURIComponent(u.password),
			maxRetriesPerRequest: null,
			enableReadyCheck: false,
			tls: u.protocol === "rediss:" ? {} : undefined,
		};
	}
	return {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT || "6379"),
		username: process.env.REDIS_USERNAME || "default",
		password: process.env.REDIS_PASSWORD,
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
		tls: process.env.REDIS_TLS === "true" ? {} : undefined,
	};
}

// Serialize msgObj: Buffer → in-memory ref, file path → stored as-is, text → stored as-is
function serializeMsgObj(msgObj) {
	const type = Object.keys(msgObj)[0];
	const value = msgObj[type];

	if (Buffer.isBuffer(value)) {
		const ref = crypto.randomUUID();
		bufferRefs.set(ref, value);
		setTimeout(() => bufferRefs.delete(ref), 10 * 60 * 1000);
		return { type, bufferRef: ref };
	}
	if (typeof value === "string" && MEDIA_TYPES.includes(type)) {
		return { type, filePath: value };
	}
	return { type, value };
}

async function deserializeMsgObj({ type, bufferRef, filePath, value }) {
	if (bufferRef) {
		const buf = bufferRefs.get(bufferRef);
		if (!buf) throw new Error(`Buffer ref ${bufferRef} expired (bot restarted mid-queue?)`);
		return { [type]: buf };
	}
	if (filePath) {
		return { [type]: await readFileEfficiently(filePath) };
	}
	return { [type]: value };
}

// Safely JSON-stringify WhatsApp message for sendOptions.quoted — handles BigInt + Buffers
function sanitizeSendOptions(opts) {
	if (!opts) return {};
	try {
		return JSON.parse(
			JSON.stringify(opts, (_, v) => {
				if (typeof v === "bigint") return Number(v);
				if (Buffer.isBuffer(v)) return undefined;
				return v;
			}),
		);
	} catch {
		return {};
	}
}

let _queue = null;

export const initBullQueue = async () => {
	const conn = getConn();

	_queue = new Queue(QUEUE_NAME, {
		connection: conn,
		defaultJobOptions: {
			attempts: 5,
			backoff: { type: "fixed", delay: 7000 },
			removeOnComplete: true,
			removeOnFail: 30,
		},
	});

	const worker = new Worker(
		QUEUE_NAME,
		async (job) => {
			const { to, msgSerialized, sendOptions, isGroupChat } = job.data;

			const sock = getSock();
			if (!sock?.user) throw new Error("Socket not ready");

			const msgObj = await deserializeMsgObj(msgSerialized);

			if (!isGroupChat) {
				sock.presenceSubscribe(to).catch(() => {});
				await new Promise((r) => setTimeout(r, 300));
				sock.sendPresenceUpdate("composing", to).catch(() => {});
				await new Promise((r) => setTimeout(r, 500));
			}

			try {
				await sock.sendMessage(to, msgObj, {
					...sendOptions,
					mediaUploadTimeoutMs: isGroupChat ? 10 * 60 * 1000 : 5 * 60 * 1000,
				});
			} finally {
				if (!isGroupChat) {
					sock.sendPresenceUpdate("paused", to).catch(() => {});
				}
			}
		},
		{
			connection: conn,
			concurrency: 5,
		},
	);

	worker.on("failed", (job, err) =>
		console.error(`[BullMQ] Job ${job?.id} failed: ${err.message}`),
	);

	// Graceful shutdown
	const shutdown = async () => {
		await worker.close();
		await _queue.close();
	};
	process.once("SIGTERM", shutdown);
	process.once("SIGINT", shutdown);

	console.log("✅ BullMQ message queue initialized");
	return _queue;
};

export const bullEnqueue = async (to, msgObj, sendOptions, isGroupChat, priority = 1) => {
	if (!_queue) throw new Error("BullMQ not initialized");
	const msgSerialized = serializeMsgObj(msgObj);
	const safeSendOptions = sanitizeSendOptions(sendOptions);
	await _queue.add("send", { to, msgSerialized, sendOptions: safeSendOptions, isGroupChat }, { priority });
};

export const isBullReady = () => !!_queue;
