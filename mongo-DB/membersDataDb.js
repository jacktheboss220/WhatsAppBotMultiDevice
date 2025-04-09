const mdClient = require("../mongodb");
mdClient.connect();

const member = mdClient.db("MyBotDataDB").collection("Members");

const createMembersData = async (jid, name) => {
	try {
		const res = await member.findOne({ _id: jid });
		if (res == null) {
			await member.insertOne({
				_id: jid,
				username: name,
				isBlock: false,
				totalmsg: 0,
				dmLimit: 1000,
				warning: [],
			});
		} else {
			await member.updateOne(
				{ _id: jid },
				{
					$set: { username: name },
				}
			);
		}
	} catch (err) {
		console.log(err);
	}
};

const getMemberData = async (jid) => {
	try {
		const res = await member.findOne({ _id: jid });
		return res;
	} catch (err) {
		console.log(err);
		return -1;
	}
};

module.exports = { createMembersData, getMemberData, member };
