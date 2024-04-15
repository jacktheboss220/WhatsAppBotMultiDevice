const fs = require("fs");
const mdClient = require("../mongodb");

const authNameInDatabase = "auth";

const fetchAuth = async (type) => {
    if (type == "logout" || type == "error") {
        fs.rmSync("baileys_auth_info/creds.json", {
            recursive: true,
            force: true,
        });
        fs.rmSync("baileys_store_multi.json", {
            recursive: true,
            force: true,
        });
    }
    try {
        if (!fs.existsSync("./baileys_auth_info")) {
            fs.mkdirSync("./baileys_auth_info");
        }
        let collection = mdClient.db("MyBotDataDB").collection("AuthTable");
        await collection.findOne({ _id: authNameInDatabase }).then(async (res) => {
            if (res == null) {
                console.log("Auth not found in database");
                await collection.insertOne({
                    _id: authNameInDatabase,
                    sessionAuth: "",
                });
            }
        });
        let result = await collection.findOne({ _id: authNameInDatabase });
        let sessionAuth = result["sessionAuth"];
        if (sessionAuth != "") {
            sessionAuth = JSON.parse(sessionAuth);
            sessionAuth = JSON.stringify(sessionAuth);
            if (type == "start") {
                fs.writeFileSync("baileys_auth_info/creds.json", sessionAuth);
            } else if (type == "reconnecting") {
                console.log("Auth already written");
            }
        } else {
            console.log("Session Auth Empty");
        }
    } catch (err) {
        console.error("Local file writing errors:", err);
    }
}

const updateLogin = async () => {
    let collection = mdClient.db("MyBotDataDB").collection("AuthTable");
    try {
        let sessionDataAuth = fs.readFileSync("baileys_auth_info/creds.json");
        sessionDataAuth = JSON.parse(sessionDataAuth);
        sessionDataAuth = JSON.stringify(sessionDataAuth);
        collection.updateOne(
            { _id: authNameInDatabase },
            { $set: { sessionAuth: sessionDataAuth } }
        );
        console.log("Db updated");
    } catch (err) {
        console.log("Db updating error : ", err);
    }
}

module.exports = { fetchAuth, updateLogin };