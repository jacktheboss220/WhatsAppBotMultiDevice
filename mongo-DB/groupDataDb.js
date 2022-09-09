const mdClient = require("../mongodb");
mdClient.connect();

const group = mdClient.db("MyBotDataDB").collection("Groups");

const createGroupData = (groupJid) => {
    group.findOne({ _id: groupJid }).then(res => {
        if (res == null) {
            // console.log('Creating Group Data : ', groupJid);
            group.insertOne({
                _id: groupJid,
                isBotOn: false,
                isChatBotOn: false,
                is91Only: false,
                cmdBlocked: "",
                totalMsgCount: 0,
                members: {
                }
            })
        }
        // else console.log("Already Created : ", groupJid);
        //  else {
        // group.updateOne(
        //     { _id: groupJid }, {
        //         $set: {
        //             isBotOn: true,
        //             isChatBotOn: false,
        //         }
        // })
        // console.log("Updated Data");
        // }
    }).catch(err => {
        console.log(err);
    })
}

const getGroupData = async (groupJid) => {
    return await group.findOne({ _id: groupJid });
}

module.exports = { getGroupData, createGroupData, group };

