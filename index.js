/**
 * @author: github:jacktheboss220
 * @description: This is the main file of the bot.
 * @license: MIT
 * @file: index.js
 */
const startSock = require("./connection");
const getDate = require("./functions/getDate");
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 8000;
app.get("/", (req, res) => {
    res.send({
        message: "Bot is running.. :)",
        timestamp: getDate()
    });
});

app.listen(port, () => {
    console.log("\nWeb-server running!\n" + getDate());
    const host_url = process.env.HOST_URL || "";
    if (host_url != "") {
        const axios = require("axios");
        console.log("Pinging server every 15 minutes:", host_url);
        const pingServer = setInterval(() => {
            axios.get(host_url).then((response) => {
                console.log(
                    "Initial self-request successful:",
                    response.data.timestamp
                );
            }).catch((error) => {
                console.error("Initial self-request error:", error.message);
                clearInterval(pingServer);
            });
        }, 1000 * 60 * 15); // 15 minutes
    }
});

app.on("error", (error) => {
    console.error("Web-server error:", error.message);
});

startSock("start");
//-------------------------------------------------------------------------------------------------------------//
process.on("unhandledRejection", (reason, p) => {
    console.log("Unhandled Rejection at: ", p, "reason:", reason);
});
//-------------------------------------------------------------------------------------------------------------//
process.on("uncaughtException", function (err) {
    console.log(err);
});
//-------------------------------------------------------------------------------------------------------------//
