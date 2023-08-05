const mdClient = require("../mongodb");
mdClient.connect();

const member = mdClient.db("MyBotDataDB").collection("members");

const createMembersData = (jid, name) => {
    member.findOne({ _id: jid }).then(res => {
        if (res == null) {
            // console.log("Creating Member Data : ", jid);
            member.insertOne({
                _id: jid,
                username: name,
                isBlock: false,
                totalmsg: 0,
                dmLimit: 1000,
                warning: []
            })
        } else {
            if (res.warning.length == undefined) {
                member.updateOne({ _id: jid }, {
                    $set: {
                        username: name,
                        warning: []
                    }
                })
            }
            else {
                member.updateOne({ _id: jid }, {
                    $set: { username: name }
                })
            }
        }
        // else console.log("ALready Created Member Data : ", jid);
    })
}

const getMemberData = (jid) => {
    return member.findOne({ _id: jid }).then(res => {
        return res;
    }).catch(err => {
        console.log(err);
        return -1;
    });
}
module.exports = { createMembersData, getMemberData, member };