const startSock = require("./connection");
const getDate = require("./functions/getDate");

const cors = require('cors');
const express = require("express");
const bodyParser = require('body-parser');

const app = express();
const path = require('path');

app.use(cors());
app.use(bodyParser.json());

app.set('views', path.join(__dirname, './public'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.render('index');
});
//-------------------------------------------------------------------------------------------------------------//
app.listen(port, () => {
    console.log("\nWeb-server running!\n" + getDate());
});
//-------------------------------------------------------------------------------------------------------------//
app.on("error", (error) => {
    console.error("Web-server error:", error.message);
});

(async () => {
    const sock = await startSock("start");
})();
//                                                         -------------------------------------------------------------------------------------------------------------//
process.on("unhandledRejection", (reason, p) => {
    console.log("Unhandled Rejection at: ", p, "reason:", reason);
});
//-------------------------------------------------------------------------------------------------------------//
process.on("uncaughtException", function (err) {
    console.log(err);
});
//-------------------------------------------------------------------------------------------------------------//
