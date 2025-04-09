const mdClient = require("../mongodb");
const authNameInDatabase = "auth";

const fetchAuth = async (state) => {
	try {
		let collection = mdClient.db("MyBotDataDB").collection("AuthTable");
		let result = await collection.findOneAndUpdate(
			{ _id: authNameInDatabase },
			{ $setOnInsert: { sessionAuth: "" } },
			{ upsert: true, returnDocument: "after" }
		);

		let sessionAuth = result?.sessionAuth;
		if (sessionAuth != "" && sessionAuth != null) {
			let data = JSON.parse(sessionAuth);

			const noiseKey = JSON.parse(data.noiseKey);
			const signedIdentityKey = JSON.parse(data.signedIdentityKey);
			const signedPreKey = JSON.parse(data.signedPreKey);
			const signalIdentities = JSON.parse(data.signalIdentities);

			const signalCreds = {
				signedIdentityKey: {
					private: Buffer.from(signedIdentityKey.private),
					public: Buffer.from(signedIdentityKey.public),
				},
				signedPreKey: {
					keyPair: {
						private: Buffer.from(signedPreKey.keyPair.private),
						public: Buffer.from(signedPreKey.keyPair.public),
					},
					signature: Buffer.from(signedPreKey.signature),
					keyId: signedPreKey.keyId,
				},
				registrationId: Number(data.registrationId),
			};

			let creds = {
				...state.creds,
				...signalCreds,
				noiseKey: {
					private: Buffer.from(noiseKey.private),
					public: Buffer.from(noiseKey.public),
				},
				advSecretKey: data.advSecretKey,
				me: JSON.parse(data.me),
				account: JSON.parse(data.account),
				signalIdentities: [
					{
						identifier: signalIdentities[0].identifier,
						identifierKey: Buffer.from(signalIdentities[0].identifierKey),
					},
				],
				myAppStateKeyId: data.myAppStateKeyId,
				firstUnuploadedPreKeyId: Number(data.firstUnuploadedPreKeyId),
				nextPreKeyId: Number(data.nextPreKeyId),
				lastAccountSyncTimestamp: Number(data.lastAccountSyncTimestamp),
			};

			return creds;
		} else {
			console.log("Session Auth Empty");
			return null;
		}
	} catch (err) {
		console.error("Local file writing errors:", err);
		return null;
	}
};

const updateLogin = async (state) => {
	let collection = mdClient.db("MyBotDataDB").collection("AuthTable");
	try {
		let sessionDataAuth = await getKeyValue(state);
		sessionDataAuth = JSON.stringify(sessionDataAuth);
		await collection.updateOne({ _id: authNameInDatabase }, { $set: { sessionAuth: sessionDataAuth } });
		console.log("Db updated");
	} catch (err) {
		console.log("Db updating error : ", err);
	}
};

const getKeyValue = async (state) => {
	const noiseKey = JSON.stringify(state.creds.noiseKey);
	const signedIdentityKey = JSON.stringify(state.creds.signedIdentityKey);
	const signedPreKey = JSON.stringify(state.creds.signedPreKey);
	const {
		registrationId,
		advSecretKey,
		nextPreKeyId,
		firstUnuploadedPreKeyId,
		lastAccountSyncTimestamp,
		myAppStateKeyId,
	} = state.creds;
	const account = JSON.stringify(state.creds.account);
	const me = JSON.stringify(state.creds.me);
	const signalIdentities = JSON.stringify(state.creds.signalIdentities);

	return {
		noiseKey,
		signedIdentityKey,
		signedPreKey,
		registrationId,
		advSecretKey,
		nextPreKeyId,
		firstUnuploadedPreKeyId,
		account,
		me,
		signalIdentities,
		lastAccountSyncTimestamp,
		myAppStateKeyId,
	};
};

module.exports = { fetchAuth, updateLogin };
