require('dotenv').config();
//-------------------------------------------------------------------------------------------------------------//
//-------------------------------------------------------------------------------------------------------------//
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_KEY}@myauthdb.edxmu.mongodb.net/?retryWrites=true&w=majority`;

const mdClient = new MongoClient(uri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1
    });
//-------------------------------------------------------------------------------------------------------------//
//-------------------------------------------------------------------------------------------------------------/
mdClient.connect();

module.exports = mdClient;