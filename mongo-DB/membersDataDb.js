import mdClient from "../mongodb.js";
mdClient.connect();

const member = mdClient.db("MyBotDataDB").collection("Members");

const createMembersData = async (jid, name) => {
	try {
		let res = await member.findOne({ _id: jid });

		if (res == null) {
			await member.insertOne({
				_id: jid,
				username: name,
				isBlock: false,
				totalmsg: 0,
				dmLimit: 99999,
				warning: [],
			});
		} else {
			await member.updateOne(
				{ _id: jid },
				{
					$set: {
						username: name,
					},
				}
			);
		}
	} catch (err) {
		console.log(err);
	}
};

const getMemberData = async (jid) => {
	try {
		let res = await member.findOne({ _id: jid });
		if (res) return res;
		return -1;
	} catch (err) {
		console.log(err);
		return -1;
	}
};

export { createMembersData, getMemberData, member };
