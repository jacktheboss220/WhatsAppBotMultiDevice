// Shared ring buffers and event bus for admin dashboard features.
// Imported by index.js (WS broadcast), routes/admin.js (API routes),
// and functions/getMessagesEvent.js (command tracking).

const MAX_LOGS = 500;
const MAX_ACTIVITY = 50;

let logId = 0;
let actId = 0;

export const logBuffer = [];
export const activityBuffer = [];
export const cmdUsage = new Map();

// Pub/sub for real-time WS broadcasting (subscribed in index.js)
const subscribers = new Set();
export function subscribe(fn) {
	subscribers.add(fn);
	return () => subscribers.delete(fn);
}
function emit(event) {
	subscribers.forEach((fn) => fn(event));
}

export function pushLog(level, ...parts) {
	const msg = parts.map((p) => (typeof p === "object" ? JSON.stringify(p) : String(p))).join(" ");
	const entry = { id: ++logId, ts: Date.now(), level, msg };
	if (logBuffer.length >= MAX_LOGS) logBuffer.shift();
	logBuffer.push(entry);
	emit({ type: "log", entry });
}

export function pushActivity(kind, detail = {}) {
	const event = { id: ++actId, ts: Date.now(), kind, detail };
	if (activityBuffer.length >= MAX_ACTIVITY) activityBuffer.shift();
	activityBuffer.push(event);
	emit({ type: "activity", event });
}

export function getLogs(limit = 200, level = "all", since = 0) {
	let logs = logBuffer;
	if (level !== "all") logs = logs.filter((e) => e.level === level);
	if (since) logs = logs.filter((e) => e.id > Number(since));
	return logs.slice(-Number(limit));
}

export function getActivity() {
	return activityBuffer.slice();
}
