require('dotenv').config();
//-------------------------------------------------------------------------------------------------------------//
//-------------------------------------------------------------------------------------------------------------//
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `${process.env.MONGODB_KEY}`;

const mdClient = new MongoClient(uri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1
    });
//-------------------------------------------------------------------------------------------------------------//

//-------------------------------------------------------------------------------------------------------------/
mdClient.connect(async (err) => {
    if (err) throw err;
    let flag = false;
    let collection = mdClient.db("MyBotDataDB");
    collection.collections((err, names) => {
        names.forEach(ele => {
            if (ele.namespace == "MyBotDataDB.AuthTable") {
                flag = true;
            }
        })
        if (flag == false) {
            collection.createCollection("AuthTable")
        }
    })
});

//-------------------------------------------------------------------------------------------------------------//

module.exports = mdClient;
