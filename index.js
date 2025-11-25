import startSock from "./connection.js";
import getDate from "./functions/getDate.js";
import memoryManager from "./functions/memoryUtils.js";
import performanceMonitor from "./functions/performanceMonitor.js";
import { normalizeJID } from "./functions/lidUtils.js";

import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";
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

app.use(bodyParser.json({ limit: "10mb" }));
app.use(
	express.static(path.join(__dirname, "public"), {
		maxAge: "1d",
		etag: false,
	})
);

app.set("views", path.join(__dirname, "./public"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
	res.render("index");
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

async function startServer() {
	const sock = await startSock("start");

	sock.ev.on("connection.update", (update) => {
		const { qr, isOnline } = update;
		if (qr) {
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ type: "qr", qr }));
				}
			});
		} else if (isOnline) {
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ type: "status", status: "connected" }));
				}
			});
		}
	});

	wss.on("connection", (ws) => {
		const heartbeat = setInterval(() => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.ping();
			}
		}, 30000);

		ws.on("pong", () => {});

		ws.on("message", async (message) => {
			try {
				const { to, message: text } = JSON.parse(message);
				if (!to || !text) {
					ws.send(JSON.stringify({ type: "error", error: "Invalid request" }));
					return;
				}

				if (text.length > 4096) {
					ws.send(JSON.stringify({ type: "error", error: "Message too long" }));
					return;
				}

				await sock.sendMessage(to + "@s.whatsapp.net", { text }).then(() => {
					console.log("Message sent to", to, ":", text);
					ws.send(JSON.stringify({ type: "success", success: "Message sent" }));
				});
			} catch (err) {
				console.error("Error handling WebSocket message:", err);
				ws.send(JSON.stringify({ type: "error", error: "Failed to send message" }));
			}
		});

		ws.on("close", () => {
			clearInterval(heartbeat);
		});

		ws.on("error", (error) => {
			console.error("WebSocket error:", error);
			clearInterval(heartbeat);
		});
	});

	app.post("/send", async (req, res) => {
		const { to, message } = req.body;
		if (!to || !message) {
			performanceMonitor.incrementErrorCount();
			return res.status(400).send({ message: "Invalid request" });
		}

		try {
			if (Array.isArray(to)) {
				const jids = await Promise.all(to.map((recipient) => normalizeJID(sock, recipient)));
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

		wss.clients.forEach((client) => {
			client.close();
		});
		memoryManager.destroy();
		performanceMonitor.saveMetrics();
		console.log("✅ Graceful shutdown completed");
		process.exit(0);
	});

	setTimeout(() => {
		console.error("❌ Forced shutdown due to timeout");
		process.exit(1);
	}, 10000); // 10 seconds timeout
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

if (process.env.NODE_ENV === "development") {
	setInterval(() => {
		const memUsage = process.memoryUsage();
		if (memUsage.heapUsed > 1024 * 1024 * 1024) {
			console.warn("⚠️  Potential memory leak detected");
			performanceMonitor.triggerMemoryCleanup();
		}
	}, 120000);
}
