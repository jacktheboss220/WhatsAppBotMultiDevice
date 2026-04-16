import startSock, { onNewSock } from "./connection.js";
import getDate from "./functions/getDate.js";
import memoryManager from "./functions/memoryUtils.js";
import performanceMonitor from "./functions/performanceMonitor.js";
import { normalizeJID } from "./functions/lidUtils.js";
import adminRouter from "./routes/admin.js";

import cors from "cors";
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
	cors({
		credentials: true,
		optionsSuccessStatus: 200,
	})
);

app.use(
	session({
		secret: process.env.SESSION_SECRET || "eva-fallback-secret",
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
	})
);

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
	console.log("\nWeb-server running!\n" + getDate());
	console.log(`Memory usage at startup: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
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

let botConnected = false;
let lastQR = null;   // Last QR code received; replayed to late-joining browser clients
let lastQRTimer = null;   // Timer to clear lastQR after it expires (~60 s)

function broadcast(payload) {
	const msg = JSON.stringify(payload);
	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) client.send(msg);
	});
}

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

onNewSock(handleNewSock);

app.locals.reconnect = () => startSock("manual-reconnect");

// ── WebSocket server ──────────────────────────────────────────────────────────
wss.on("connection", (ws) => {
	const isConnected = botConnected || app.locals.sock?.user != null;
	if (isConnected) {
		botConnected = true; // sync flag
		ws.send(JSON.stringify({ type: "status", status: "connected" }));
	} else if (lastQR) {
		// Browser missed the QR broadcast — replay the stored copy
		ws.send(JSON.stringify({ type: "qr", qr: lastQR }));
	}

	const heartbeat = setInterval(() => {
		if (ws.readyState === WebSocket.OPEN) ws.ping();
	}, 30_000);

	ws.on("pong", () => { });

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
			const sock = app.locals.sock;
			await sock.sendMessage(to + "@s.whatsapp.net", { text: message });
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
	await startSock("start");
	app.post("/send", async (req, res) => {
		const { to, message } = req.body;
		if (!to || !message) {
			performanceMonitor.incrementErrorCount();
			return res.status(400).send({ message: "Invalid request" });
		}

		try {
			const sock = app.locals.sock; // live reference
			if (Array.isArray(to)) {
				const jids = await Promise.all(to.map((r) => normalizeJID(sock, r)));
				await Promise.all(jids.map((jid) => sock.sendMessage(jid, { text: message })));
				console.log("Message sent to multiple recipients");
				performanceMonitor.incrementCommandCount();
				return res.send({ message: "Messages sent" });
			} else {
				const recipientJid = await normalizeJID(sock, to);
				await sock.sendMessage(recipientJid, { text: message });
				console.log("Message sent to", to, ":", message);
				performanceMonitor.incrementCommandCount();
				return res.send({ message: "Message sent" });
			}
		} catch (error) {
			console.error("Error sending message:", error);
			performanceMonitor.incrementErrorCount();
			return res.status(500).send({ message: "Failed to send message" });
		}
	});
}

process.on("unhandledRejection", (reason, p) => {
	console.error("Unhandled Rejection at: ", p, "reason:", reason);
	performanceMonitor.incrementErrorCount();
});

process.on("uncaughtException", function (err) {
	console.error("Uncaught Exception:", err);
	performanceMonitor.incrementErrorCount();
	gracefulShutdown("UNCAUGHT_EXCEPTION");
});

function gracefulShutdown(signal) {
	console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
	server.close(() => {
		console.log("✅ HTTP server closed");
		wss.clients.forEach((client) => client.close());
		memoryManager.destroy();
		performanceMonitor.saveMetrics();
		console.log("✅ Graceful shutdown completed");
		process.exit(0);
	});
	setTimeout(() => {
		console.error("❌ Forced shutdown due to timeout");
		process.exit(1);
	}, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

if (process.env.NODE_ENV === "development") {
	setInterval(() => {
		const mem = process.memoryUsage();
		if (mem.heapUsed > 1024 * 1024 * 1024) {
			console.warn("⚠️  Potential memory leak detected");
			performanceMonitor.triggerMemoryCleanup();
		}
	}, 120_000);
}
