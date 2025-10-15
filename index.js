const startSock = require("./connection");
const getDate = require("./functions/getDate");
const memoryManager = require("./functions/memoryUtils");
const performanceMonitor = require("./functions/performanceMonitor");

const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

// Remove cluster logic, always run as a single process

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
	// Reduce logging in production
	console.log = function () {};
	console.debug = function () {};
}

function startServer() {
	const app = express();
	const path = require("path");

	// Optimize express middleware
	app.use(
		cors({
			credentials: true,
			optionsSuccessStatus: 200,
		})
	);

	app.use(bodyParser.json({ limit: "10mb" })); // Limit body size
	app.use(
		express.static(path.join(__dirname, "public"), {
			maxAge: "1d", // Cache static files for better performance
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
		if (!isProduction) {
			console.log("\nWeb-server running!\n" + getDate());
			console.log(`Memory usage at startup: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
		}
		// const host_url = process.env.HOST_URL || "";
		// if (host_url != "") {
		//     const axios = require("axios");
		//     console.log("Pinging server every 15 minutes:", host_url);
		//     const pingServer = setInterval(() => {
		//         axios.get(host_url).then((response) => {
		//             console.log("Initial self-request successful:", response.data.timestamp);
		//         }).catch((error) => {
		//             console.error("Initial self-request error:", error.message);
		//             clearInterval(pingServer);
		//         });
		//     }, 1000 * 60 * 15); // 15 minutes
		// }
	});

	app.on("error", (error) => {
		console.error("Web-server error:", error.message);
	});

	// Optimize WebSocket server
	const wss = new WebSocket.Server({
		server,
		maxPayload: 10 * 1024 * 1024, // 10MB max message size
		perMessageDeflate: true, // Enable compression
	});

	(async () => {
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
			// Set up connection timeout and heartbeat
			const heartbeat = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.ping();
				}
			}, 30000); // 30 seconds

			ws.on("pong", () => {
				// Connection is alive
			});

			ws.on("message", async (message) => {
				try {
					const { to, message: text } = JSON.parse(message);
					if (!to || !text) {
						ws.send(JSON.stringify({ type: "error", error: "Invalid request" }));
						return;
					}

					// Validate message size
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
	})();

	app.post("/send", async (req, res) => {
		const { to, message } = req.body;
		if (!to || !message) {
			performanceMonitor.incrementErrorCount();
			return res.status(400).send({ message: "Invalid request" });
		}

		try {
			if (Array.isArray(to)) {
				// Parallel send for multiple recipients
				await Promise.all(
					to.map((recipient) => sock.sendMessage(recipient + "@s.whatsapp.net", { text: message }))
				);
				console.log("Message sent to multiple recipients");
				performanceMonitor.incrementCommandCount();
				return res.send({ message: "Messages sent" });
			} else {
				await sock.sendMessage(to + "@s.whatsapp.net", { text: message });
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

	// Enhanced error handling
	process.on("unhandledRejection", (reason, p) => {
		console.error("Unhandled Rejection at: ", p, "reason:", reason);
		performanceMonitor.incrementErrorCount();
	});

	process.on("uncaughtException", function (err) {
		console.error("Uncaught Exception:", err);
		performanceMonitor.incrementErrorCount();

		// Graceful shutdown
		gracefulShutdown("UNCAUGHT_EXCEPTION");
	});

	// Graceful shutdown function
	function gracefulShutdown(signal) {
		console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);

		// Stop accepting new connections
		server.close(() => {
			console.log("✅ HTTP server closed");

			// Close WebSocket connections
			wss.clients.forEach((client) => {
				client.close();
			});

			// Cleanup memory manager
			memoryManager.destroy();

			// Save final metrics
			performanceMonitor.saveMetrics();

			console.log("✅ Graceful shutdown completed");
			process.exit(0);
		});

		// Force exit if graceful shutdown takes too long
		setTimeout(() => {
			console.error("❌ Forced shutdown due to timeout");
			process.exit(1);
		}, 10000); // 10 seconds timeout
	}

	// Handle shutdown signals
	process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => gracefulShutdown("SIGINT"));

	// Memory leak detection
	if (process.env.NODE_ENV === "development") {
		setInterval(() => {
			const memUsage = process.memoryUsage();
			if (memUsage.heapUsed > 1024 * 1024 * 1024) {
				// 1GB
				console.warn("⚠️  Potential memory leak detected");
				performanceMonitor.triggerMemoryCleanup();
			}
		}, 120000); // Check every 2 minutes
	}
}

// Directly start the server
startServer();
