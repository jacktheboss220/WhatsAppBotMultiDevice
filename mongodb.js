require('dotenv').config();
//-------------------------------------------------------------------------------------------------------------//
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `${process.env.MONGODB_KEY}`;
//-------------------------------------------------------------------------------------------------------------//
const mdClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
//-------------------------------------------------------------------------------------------------------------/
(async () => {
    let flag = false;
    await mdClient.connect().then(() => { console.log("Connected to Database") }).catch(err => { console.log(err) });
    const db = mdClient.db('MyBotDataDB');
    const collection = await db.collections();
    collection.forEach(ele => {
        if (ele.namespace == "MyBotDataDB.AuthTable") {
            flag = true;
        }
    });
    if (flag == false) {
        await db.createCollection("AuthTable");
    }
})();
//-------------------------------------------------------------------------------------------------------------//

module.exports = mdClient;
