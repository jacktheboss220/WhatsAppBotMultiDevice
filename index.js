import startSock, { onNewSock } from "./connection.js";
import { initBullQueue } from "./queue/bullQueue.js";
import { startReminderScheduler } from "./utils/reminderScheduler.js";
import getDate from "./utils/date.js";
import { normalizeJID } from "./utils/lid.js";
import adminRouter from "./routes/admin.js";
import messageQueue from "./queue/messageQueue.js";
import { pushLog, subscribe as subscribeAdminEvents, getLogs, getActivity } from "./notify/adminEvents.js";

// ── Console interceptor — feeds log ring buffer + deduplication ──────────────
const _log   = console.log.bind(console);
const _info  = console.info.bind(console);
const _warn  = console.warn.bind(console);
const _error = console.error.bind(console);

const _SESSION_SPAM = ['Closing session:', 'Removing old closed session:'];
const _DEDUP_ONCE   = new Set(); // messages shown only once per run

function _dedup(msg) {
	const ONCE_PREFIXES = [
		'IMPORTANT! Eviction policy',  // BullMQ Redis warning (prints 3x)
	];
	const key = ONCE_PREFIXES.find(p => msg.startsWith(p));
	if (!key) return false;
	if (_DEDUP_ONCE.has(key)) return true; // suppress
	_DEDUP_ONCE.add(key);
	return false; // allow first occurrence
}

// Suppress "Credentials saved to MongoDB" within 10s of startup (creds flush storm)
let _startupTime = Date.now();
function _suppressStartupNoise(msg) {
	if (msg === '💾 Credentials saved to MongoDB' && Date.now() - _startupTime < 10000) return true;
	return false;
}

console.log   = (...a) => {
	const s = String(a[0]);
	if (_dedup(s) || _suppressStartupNoise(s)) return;
	_log(...a); pushLog('info', ...a);
};
console.info  = (...a) => {
	if (_SESSION_SPAM.some(s => String(a[0]).startsWith(s))) return;
	_info(...a); pushLog('info', ...a);
};
console.warn  = (...a) => { _warn(...a);  pushLog('warn',  ...a) };
console.error = (...a) => { _error(...a); pushLog('error', ...a) };

import cors from "cors";
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import bodyParser from "body-parser";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
	cors({
		credentials: true,
		optionsSuccessStatus: 200,
	})
);

if (!process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is not set. Cannot run application securely.");
  process.exit(1);
}

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({ mongoUrl: process.env.MONGODB_KEY, ttl: 8 * 60 * 60 }),
		cookie: { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 },
	})
);

// ── Passport / Google OAuth ────────────────────────────────────────────────────
const baseUrl = (process.env.HOST_URL || "http://localhost:8000").replace(/\/$/, "");
const googleAuthEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (googleAuthEnabled) {
	passport.use(
		new GoogleStrategy(
			{
				clientID:     process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL:  `${baseUrl}/auth/google/callback`,
			},
			(_accessToken, _refreshToken, profile, done) => done(null, profile)
		)
	);
} else {
	console.log("Google OAuth disabled — GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set.");
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());
app.locals.googleAuthEnabled = googleAuthEnabled;

app.use(bodyParser.json({ limit: "10mb" }));
app.use(
	express.static(path.join(__dirname, "public"), {
		maxAge: "1d",
		etag: false,
	})
);

// Serve the React dashboard build (public/app/) at /admin
app.use(
	"/admin",
	express.static(path.join(__dirname, "public", "app"), { maxAge: "1d", etag: false })
);

app.set("views", path.join(__dirname, "./public"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const port = process.env.PORT || 8000;

app.get("/", (_req, res) => {
	res.render("index");
});

app.use("/", adminRouter);

// SPA catch-all: any /admin/* path that wasn't handled above → serve React index.html
const reactIndex = path.join(__dirname, "public", "app", "index.html");
app.get("/admin", (_req, res) => res.sendFile(reactIndex));
app.get("/admin/*", (req, res, next) => {
	if (req.path.startsWith("/api/")) return next();
	res.sendFile(reactIndex);
});

const server = app.listen(port, () => {
	const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
	_log(`\n${"═".repeat(50)}`);
	_log(`  Eva Bot  ·  ${getDate()}`);
	_log(`  Port: ${port}  ·  Heap: ${mem}MB`);
	_log(`${"═".repeat(50)}\n`);
	startServer();
});

app.on("error", (error) => {
	console.error("Web-server error:", error.message);
});

const wss = new WebSocketServer({
	server,
	maxPayload: 10 * 1024 * 1024,
	perMessageDeflate: true,
});

// ── Bot connection state ───────────────────────────────────────────────────────
// Persists across sock reconnections via the onNewSock hook in connection.js
let botConnected = false;
let lastQR       = null;   // Last QR code received; replayed to late-joining browser clients
let lastQRTimer  = null;   // Timer to clear lastQR after it expires (~60 s)

function broadcast(payload) {
	const msg = JSON.stringify(payload);
	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) client.send(msg);
	});
}

// ── Called for every new sock — including reconnects ─────────────────────────
// This is the fix for the stale-sock bug: we always attach our listener to
// whichever sock is currently live, and always keep app.locals.sock current.
function handleNewSock(sock) {
	app.locals.sock = sock; // always up-to-date reference for admin routes

	sock.ev.on("connection.update", (update) => {
		const { qr, isOnline, connection } = update;

		if (qr) {
			botConnected = false;
			lastQR = qr;
			// QR codes expire (~60 s); clear stored copy so stale QR isn't replayed
			clearTimeout(lastQRTimer);
			lastQRTimer = setTimeout(() => { lastQR = null; }, 60_000);
			broadcast({ type: "qr", qr });
		}

		if (isOnline || connection === "open") {
			botConnected = true;
			lastQR = null;
			clearTimeout(lastQRTimer);
			broadcast({ type: "status", status: "connected" });
		}

		if (connection === "close") {
			botConnected = false;
			broadcast({ type: "status", status: "disconnected" });
		}
	});
}

// Register hook before calling startSock so it fires for the very first sock too
onNewSock(handleNewSock);

// Forward admin events (logs, activity) to all connected WS clients
subscribeAdminEvents(event => broadcast(event));

// Expose startSock so admin routes can trigger a reconnect without restarting the process
app.locals.reconnect = () => startSock("manual-reconnect");

// ── WebSocket server ──────────────────────────────────────────────────────────
wss.on("connection", (ws) => {
	// Tell newly connected browser clients the current state immediately.
	// Also check sock.user as a live fallback in case botConnected is stale.
	const isConnected = botConnected || app.locals.sock?.user != null;
	if (isConnected) {
		botConnected = true; // sync flag
		ws.send(JSON.stringify({ type: "status", status: "connected" }));
	} else if (lastQR) {
		// Browser missed the QR broadcast — replay the stored copy
		ws.send(JSON.stringify({ type: "qr", qr: lastQR }));
	}

	// Replay recent logs + activity to newly connected clients
	ws.send(JSON.stringify({ type: 'log_snapshot',      logs:     getLogs(100) }));
	ws.send(JSON.stringify({ type: 'activity_snapshot', activity: getActivity() }));

	const heartbeat = setInterval(() => {
		if (ws.readyState === WebSocket.OPEN) ws.ping();
	}, 30_000);

	ws.on("pong", () => {});

	ws.on("message", async (raw) => {
		try {
			const { to, message } = JSON.parse(raw);
			if (!to || !message) {
				ws.send(JSON.stringify({ type: "error", error: "Invalid request" }));
				return;
			}
			if (message.length > 4096) {
				ws.send(JSON.stringify({ type: "error", error: "Message too long" }));
				return;
			}
			// Always use the live sock reference (fixes stale-sock bug for messages too)
			const sock = app.locals.sock;
			const jid = to + "@s.whatsapp.net";
			await messageQueue.enqueue(jid, () => sock.sendMessage(jid, { text: message }), 0);
			console.log("Message sent to", to, ":", message);
			ws.send(JSON.stringify({ type: "success", success: "Message sent" }));
		} catch (err) {
			console.error("Error handling WebSocket message:", err);
			ws.send(JSON.stringify({ type: "error", error: "Failed to send message" }));
		}
	});

	ws.on("close", () => clearInterval(heartbeat));
	ws.on("error", (err) => { console.error("WebSocket error:", err); clearInterval(heartbeat); });
});

// ── Bot start ─────────────────────────────────────────────────────────────────
async function startServer() {
	await initBullQueue().catch((err) => console.error("BullMQ init failed, falling back to in-memory queue:", err.message));
	await startSock("start");
	startReminderScheduler();
	// handleNewSock() is called by the onNewSock hook inside connection.js,
	// so app.locals.sock and connection.update listener are both set up there.

	app.post("/send", async (req, res) => {
		const { to, message } = req.body;
		if (!to || !message) {
			return res.status(400).send({ message: "Invalid request" });
		}

		try {
			const sock = app.locals.sock; // live reference
			if (Array.isArray(to)) {
				const jids = await Promise.all(to.map((r) => normalizeJID(sock, r)));
				await Promise.all(jids.map((jid) => messageQueue.enqueue(jid, () => sock.sendMessage(jid, { text: message }), 0)));
				console.log("Message queued for multiple recipients");
				return res.send({ message: "Messages queued" });
			} else {
				const recipientJid = await normalizeJID(sock, to);
				await messageQueue.enqueue(recipientJid, () => sock.sendMessage(recipientJid, { text: message }), 0);
				console.log("Message queued for:", to);
				return res.send({ message: "Message queued" });
			}
		} catch (error) {
			console.error("Error sending message:", error);
			return res.status(500).send({ message: "Failed to send message" });
		}
	});
}

process.on("unhandledRejection", (reason, p) => {
	console.error("Unhandled Rejection at: ", p, "reason:", reason);
});

process.on("uncaughtException", function (err) {
	console.error("Uncaught Exception:", err);
	gracefulShutdown("UNCAUGHT_EXCEPTION");
});

function gracefulShutdown(signal) {
	console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
	server.close(() => {
		console.log("✅ HTTP server closed");
		wss.clients.forEach((client) => client.close());
		console.log("✅ Graceful shutdown completed");
		process.exit(0);
	});
	setTimeout(() => {
		console.error("❌ Forced shutdown due to timeout");
		process.exit(1);
	}, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
