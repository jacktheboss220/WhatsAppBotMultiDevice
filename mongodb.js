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
mdClient.connect();

module.exports = mdClient;
