const mdClient = require("../mongodb");
mdClient.connect();

const { createMembersData, getMemberData, member } = require('./membersDataDb');

// for blocking the user
const block = async (jid, name) => {
    createMembersData(jid);
    await getMemberData(jid).then(res => {
        if (res.isBlock == false) {
            member.updateOne(
                { _id: jid },
                {
                    $set: {
                        username: name,
                        isBlock: true
                    }
                }).then(() => {
                    console.log("User Blocked : ", jid);
                });
        }
    })
}

// for unblocking the user
const unblock = async (jid, name) => {
    createMembersData(jid);
    await getMemberData(jid).then(res => {
        if (res.isBlock == true) {
            member.updateOne(
                { _id: jid },
                {
                    $set: {
                        username: name,
                        isBlock: false
                    }
                }).then(() => {
                    console.log("User UnBlocked : ", jid);
                });
        }
    })
}

//warning
const warning = async (jid) => {
    createMembersData(jid);
    await getMemberData(jid).then(res => {
        console.log(res.warning);
    })
}

module.exports = { block, unblock, warning };
