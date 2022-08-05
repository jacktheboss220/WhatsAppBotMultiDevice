require('dotenv').config()
const { Pool } = require("pg");

const proConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
};

const pool = new Pool(proConfig);

//create countblock table if not there
const createBlockCmdsTable = async () => {
    await pool.query(
        "CREATE TABLE IF NOT EXISTS blockCmds(groupjid text , cmd text);"
    );
};

// const getCmdToBlock = (groupjid) => {
module.exports.getCmdToBlock = async (groupjid) => {
    await createBlockCmdsTable();
    let result = await pool.query(
        "SELECT cmd FROM blockCmds WHERE groupjid=$1;",
        [groupjid]
    );
    if (result.rowCount) {
        return result.rows[0].cmd;
    } else {
        return -1;
    }
};
// const setCmdToBlock = (groupjid, cmdName) => {
module.exports.setCmdToBlock = async (groupjid, cmdName) => {
    if (!groupjid.endsWith("@g.us")) return;
    await createBlockCmdsTable();

    //check if groupjid is present in DB or not
    let result = await pool.query(
        "select * from blockCmds WHERE groupjid=$1;",
        [groupjid]
    );

    //present
    if (result.rows.length) {
        let count = result.rows[0].count;
        await pool.query(
            "UPDATE blockCmds SET cmd = $1 WHERE groupjid=$2;",
            [cmdName, groupjid]
        );
        await pool.query("commit;");
        return count;
    } else {
        await pool.query("INSERT INTO blockCmds VALUES($1,$2);", [
            groupjid,
            cmdName,
        ]);
        await pool.query("commit;");
        return 1;
    }
};