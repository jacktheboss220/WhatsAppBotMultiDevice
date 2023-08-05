require('dotenv').config();
//-------------------------------------------------------------------------------------------------------------//
//-------------------------------------------------------------------------------------------------------------//
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `${process.env.MONGODB_KEY}`;

// const mdClient = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverApi: ServerApiVersion.v1
// });
//-------------------------------------------------------------------------------------------------------------//
const mdClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
//-------------------------------------------------------------------------------------------------------------/
async function main() {
    let flag = false;
    await mdClient.connect();
    console.log('Connected successfully to Database');
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
    return "done";
}
//-------------------------------------------------------------------------------------------------------------//
main();
//-------------------------------------------------------------------------------------------------------------//
// client.connect(async (err) => {
//     if (err) throw err;
//     let flag = false;
//     let collection = client.db("MyBotDataDB");
//     collection.collections((err, names) => {
//         names.forEach(ele => {
//             if (ele.namespace == "MyBotDataDB.AuthTable") {
//                 flag = true;
//             }
//         })
//         if (flag == false) {
//             collection.createCollection("AuthTable")
//         }
//     })
// });

//-------------------------------------------------------------------------------------------------------------//

module.exports = mdClient;
