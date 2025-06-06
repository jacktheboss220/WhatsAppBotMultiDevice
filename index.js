const startSock = require("./connection");
const getDate = require("./functions/getDate");

const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const app = express();
const path = require("path");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "./public"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
	res.render("index");
});

const server = app.listen(port, () => {
	console.log("\nWeb-server running!\n" + getDate());
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

const wss = new WebSocket.Server({ server });

(async () => {
	const sock = await startSock("start");
        sock.ev.on("connection.update", (update) => {
                const { qr, connection } = update;
                if (qr || connection) {
                        const message = JSON.stringify({ qr, connection });
                        wss.clients.forEach((client) => {
                                if (client.readyState === WebSocket.OPEN) {
                                        client.send(message);
                                }
                        });
                }
        });

	app.post("/send", async (req, res) => {
		const { to, message } = req.body;
		if (!to || !message) {
			return res.status(400).send({ message: "Invalid request" });
		}
		await sock.sendMessage(to + "@s.whatsapp.net", { text: message }).then((response) => {
			console.log("Message sent to", to, ":", message);
		});
		return res.send({ message: "Message sent" });
	});
})();

process.on("unhandledRejection", (reason, p) => {
	console.error("Unhandled Rejection at: ", p, "reason:", reason);
});

process.on("uncaughtException", function (err) {
	console.error(err);
});
