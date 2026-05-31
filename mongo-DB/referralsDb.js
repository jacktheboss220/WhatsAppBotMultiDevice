import mdClient from "../mongodb.js";

const referrals = mdClient.db("MyBotDataDB").collection("Referrals");

const getReferralData = async (companyName) => {
	try {
		const res = await referrals.findOne({ _id: companyName.toLowerCase() });
		return res || null;
	} catch (err) {
		console.error("[referralsDb error]", err.message);
		return null;
	}
};

const createReferral = async (companyName, userJid, userName) => {
	try {
		const lowerName = companyName.toLowerCase();

		const allReferrals = await referrals.find({}).toArray();
		let userFoundIn = null;

		for (const company of allReferrals) {
			const userIndex = company.users.findIndex((u) => u.jid === userJid);
			if (userIndex !== -1) {
				userFoundIn = company;
				break;
			}
		}

		if (userFoundIn) {
			if (userFoundIn._id === lowerName) {
				return { created: false, reason: "already_registered" };
			}
			await referrals.updateOne({ _id: userFoundIn._id }, { $pull: { users: { jid: userJid } } });
		}

		let existing = await referrals.findOne({ _id: lowerName });
		if (existing) {
			await referrals.updateOne(
				{ _id: lowerName },
				{ $push: { users: { jid: userJid, name: userName, timestamp: new Date() } } },
			);
		} else {
			await referrals.insertOne({
				_id: lowerName,
				companyName: companyName,
				users: [{ jid: userJid, name: userName, timestamp: new Date() }],
			});
		}
		return { created: true, company: lowerName, moved: !!userFoundIn };
	} catch (err) {
		console.error("[referralsDb error]", err.message);
		return null;
	}
};

const getAllReferrals = async () => {
	try {
		const res = await referrals.find({}).toArray();
		return res;
	} catch (err) {
		console.error("[referralsDb error]", err.message);
		return [];
	}
};

const updateReferral = async (companyName, newCompanyName) => {
	try {
		const lowerName = companyName.toLowerCase();
		const res = await referrals.findOne({ _id: lowerName });
		if (!res) return { success: false, reason: "not_found" };

		await referrals.updateOne(
			{ _id: lowerName },
			{
				$set: {
					_id: newCompanyName.toLowerCase(),
					companyName: newCompanyName,
				},
			},
		);
		return { success: true };
	} catch (err) {
		console.error("[referralsDb error]", err.message);
		return { success: false };
	}
};

const deleteReferral = async (companyName) => {
	try {
		const lowerName = companyName.toLowerCase();
		const res = await referrals.deleteOne({ _id: lowerName });
		return res.deletedCount > 0 ? { success: true } : { success: false, reason: "not_found" };
	} catch (err) {
		console.error("[referralsDb error]", err.message);
		return { success: false };
	}
};

const searchReferrals = async (searchTerm) => {
	try {
		const regex = new RegExp(searchTerm, "i");
		const res = await referrals.find({ companyName: regex }).toArray();
		return res;
	} catch (err) {
		console.error("[referralsDb error]", err.message);
		return [];
	}
};

const updateUserRef = async (userJid, newCompanyName) => {
	try {
		const allReferrals = await referrals.find({}).toArray();
		let userFound = null;
		let oldCompany = null;

		for (const company of allReferrals) {
			const userIndex = company.users.findIndex((u) => u.jid === userJid);
			if (userIndex !== -1) {
				userFound = company.users[userIndex];
				oldCompany = company;
				break;
			}
		}

		if (!userFound) return { success: false, reason: "user_not_found" };

		if (oldCompany._id === newCompanyName.toLowerCase()) {
			return { success: false, reason: "same_company" };
		}

		await referrals.updateOne({ _id: oldCompany._id }, { $pull: { users: { jid: userJid } } });

		let newCompany = await referrals.findOne({ _id: newCompanyName.toLowerCase() });
		if (newCompany) {
			await referrals.updateOne(
				{ _id: newCompanyName.toLowerCase() },
				{ $push: { users: { jid: userJid, name: userFound.name, timestamp: new Date() } } },
			);
		} else {
			await referrals.insertOne({
				_id: newCompanyName.toLowerCase(),
				companyName: newCompanyName,
				users: [{ jid: userJid, name: userFound.name, timestamp: new Date() }],
			});
		}

		return { success: true, oldCompany: oldCompany.companyName };
	} catch (err) {
		console.error("[referralsDb error]", err.message);
		return { success: false };
	}
};

export {
	getReferralData,
	createReferral,
	getAllReferrals,
	updateReferral,
	deleteReferral,
	searchReferrals,
	updateUserRef,
	referrals,
};
