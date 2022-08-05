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
const createBlockTable = async () => {
    await pool.query(
        "CREATE TABLE IF NOT EXISTS countblock(memberjid text , count integer);"
    );
};

module.exports.getBlockWarning = async (memberjid) => {
    await createBlockTable();
    let result = await pool.query(
        "SELECT count FROM countblock WHERE memberjid=$1;",
        [memberjid]
    );
    if (result.rowCount) {
        return result.rows[0].count;
    } else {
        return -1;
    }
};

module.exports.setBlockWarning = async (memberJid) => {
    // if (!memberJid.endsWith("@g.us")) return;
    await createBlockTable();

    //check if groupjid is present in DB or not
    let result = await pool.query(
        "select * from countblock WHERE memberjid=$1;",
        [memberJid]
    );

    //present
    if (result.rows.length) {
        let count = result.rows[0].count;

        await pool.query(
            "UPDATE countblock SET count = 1 WHERE memberjid=$1;",
            [memberJid]
        );
        await pool.query("commit;");
        return count;
    } else {
        await pool.query("INSERT INTO countblock VALUES($1,$2);", [
            memberJid,
            1,
        ]);
        await pool.query("commit;");
        return 1;
    }
};

module.exports.removeBlockWarning = async (memberJid) => {
    // if (!groupJid.endsWith("@g.us")) return;
    await createBlockTable();

    //check if groupjid is present in DB or not
    let result = await pool.query(
        "select * from countblock WHERE memberjid=$1;",
        [memberJid]
    );

    //present
    if (result.rows.length) {
        let count = result.rows[0].count;

        await pool.query(
            "UPDATE countblock SET count = 0 WHERE memberjid=$1;",
            [memberJid]
        );
        await pool.query("commit;");
        return count;
    } else {
        await pool.query("INSERT INTO countblock VALUES($1,$2);", [
            memberJid,
            0,
        ]);
        await pool.query("commit;");
        return 1;
    }
};
