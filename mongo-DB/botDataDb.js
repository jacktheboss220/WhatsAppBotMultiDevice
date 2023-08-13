const mdClient = require("../mongodb");
mdClient.connect();

const bot = mdClient.db("MyBotDataDB").collection("AuthTable");

const createBotData = () => {
    bot.findOne({ _id: "bot" }).then(res => {
        if (res == null) {
            // console.log('Creating Group Data : ', groupJid);
            bot.insertOne({
                _id: "bot",
                instaSession_id: "",
            })
        }
        // else console.log("Already Created : ", groupJid);
        else {
            // console.log("Updated Data");
        }
    }).catch(err => {
        console.log(err);
    })
}

const getBotData = async () => {
    return await bot.findOne({ _id: "bot" }).then(res => {
        return res;
    }).catch(err => {
        return -1;
    });
}

module.exports = { getBotData, createBotData, bot };