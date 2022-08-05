require('dotenv').config()
const { Pool } = require("pg");

const proConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
};

const pool = new Pool(proConfig);

//create createCountWarningTable table if not there
const createCountDMTable = async () => {
    await pool.query(
        "CREATE TABLE IF NOT EXISTS countDM(memberjid1 text, count1 integer);"
    );
};
module.exports.getCountDM = async (memberjid) => {
    await createCountDMTable();
    let result = await pool.query(
        "SELECT count1 FROM countDM WHERE memberjid1=$1;",
        [memberjid]
    );
    if (result.rowCount) {
        return result.rows[0].count1;
    } else {
        return 0;
    }
};
module.exports.setCountDM = async (memberJid) => {
    await createCountDMTable();

    //check if groupjid is present in DB or not
    let result = await pool.query(
        "select * from countDM WHERE memberjid1=$1;",
        [memberJid]
    );

    //present
    if (result.rows.length) {
        let count = result.rows[0].count1;

        await pool.query(
            "UPDATE countDM SET count1 = count1+1 WHERE memberjid1=$1;",
            [memberJid]
        );
        await pool.query("commit;");
        return count + 1;
    } else {
        await pool.query("INSERT INTO countDM VALUES($1,$2);", [
            memberJid,
            1,
        ]);
        await pool.query("commit;");
        return 1;
    }
};

module.exports.setCountDMOwner = async (memberJid) => {
    await createCountDMTable();

    //check if groupjid is present in DB or not
    let result = await pool.query(
        "select * from countDM WHERE memberjid1=$1;",
        [memberJid]
    );

    //present
    if (result.rows.length) {
        let count = result.rows[0].count1;

        await pool.query(
            "UPDATE countDM SET count1 = 0 WHERE memberjid1=$1;",
            [memberJid]
        );
        await pool.query("commit;");
        return count;
    } else {
        await pool.query("INSERT INTO countDM VALUES($1,$2);", [
            memberJid,
            0,
        ]);
        await pool.query("commit;");
        return 1;
    }
};

module.exports.removeCountDM = async () => {
    await createCountDMTable();
    //present
    await pool.query(
        "UPDATE countDM SET count1 = 0;"
    );
    await pool.query("commit;");
};
