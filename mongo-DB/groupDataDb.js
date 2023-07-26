const mdClient = require("../mongodb");
mdClient.connect();

const group = mdClient.db("MyBotDataDB").collection("Groups");

const createGroupData = (groupJid, groupMetadata) => {
    group.findOne({ _id: groupJid }).then(res => {
        if (res == null) {
            // console.log('Creating Group Data : ', groupJid);
            group.insertOne({
                _id: groupJid,
                isBotOn: false,
                isImgOn: false,
                isChatBotOn: false,
                is91Only: false,
                grpName: groupMetadata.subject,
                desc: groupMetadata.desc ? groupMetadata.desc.toString() : "",
                cmdBlocked: [],
                welcome: "",
                totalMsgCount: 0,
                memberWarnCount: [],
                members: []
            })
        }
        // else console.log("Already Created : ", groupJid);
        else {
            if (res.memberWarnCount == undefined || res.memberWarnCount.length == undefined) {
                group.updateOne({ _id: groupJid }, {
                    $set: {
                        memberWarnCount: [],
                        grpName: groupMetadata.subject,
                        desc: groupMetadata.desc ? groupMetadata.desc.toString() : ""
                    }
                })
            } else {
                group.updateOne({ _id: groupJid }, {
                    $set: {
                        grpName: groupMetadata.subject,
                        desc: groupMetadata.desc ? groupMetadata.desc.toString() : ""
                    }
                })
            }
            // console.log("Updated Data");
        }
    }).catch(err => {
        console.log(err);
    })
}

const getGroupData = async (groupJid) => {
    return await group.findOne({ _id: groupJid }).then(res => {
        return res;
    }).catch(err => {
        return -1;
    });
}

module.exports = { getGroupData, createGroupData, group };

