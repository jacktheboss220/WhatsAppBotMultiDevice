require("dotenv").config();
const { Pool } = require('pg');

const proConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
}

const pool = new Pool(proConfig);

module.exports = {
    query: (text, params) => pool.query(text, params)
}
// function clear() {
//     pool.query(`begin;
// set transaction read write;
// DROP table auth;
// COMMIT;`)
// };
// clear();
//"@adiwajshing/baileys": "github:adiwajshing/Baileys#a75d9118bdc7829a12dcb5f758dc5f92528a272d",
