import mdClient from "../mongodb.js";

mdClient.connect();

const group = mdClient.db("MyBotDataDB").collection("Groups");

const createGroupData = async (groupJid, groupMetadata) => {
	try {
		const res = await group.findOne({ _id: groupJid });
		if (res == null) {
			await group.insertOne({
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
				members: [],
				chatHistory: [],
			});
		} else {
			await group.updateOne(
				{ _id: groupJid },
				{
					$set: {
						grpName: groupMetadata.subject,
						desc: groupMetadata.desc ? groupMetadata.desc.toString() : "",
					},
				}
			);
		}
	} catch (err) {
		console.log(err);
	}
};

const getGroupData = async (groupJid) => {
	try {
		const res = await group.findOne({ _id: groupJid });
		return res;
	} catch (err) {
		console.log(err);
		return -1;
	}
};

export { getGroupData, createGroupData, group };

