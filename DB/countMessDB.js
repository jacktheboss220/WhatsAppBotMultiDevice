require("dotenv").config();
const { Pool } = require("pg");

const proConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
};

const pool = new Pool(proConfig);

//create countmember table if not there
const createCountMemberTable = async () => {
    await pool.query(
        "CREATE TABLE IF NOT EXISTS countmember(memberjid text , groupjid text, count integer, PRIMARY KEY (memberjid, groupjid));"
    );
};

//create countmembername table if not there
const createCountMemberNameTable = async () => {
    await pool.query(
        "CREATE TABLE IF NOT EXISTS countmembername(memberjid text PRIMARY KEY, name text);"
    );
};

module.exports.getCountGroupMembers = async (groupJid) => {
    await createCountMemberTable();
    let result = await pool.query(
        "SELECT DISTINCT memberJid,count FROM countmember WHERE groupJid=$1 ORDER BY count DESC;",
        [groupJid]
    );
    if (result.rowCount) {
        return result.rows;
    } else {
        return [];
    }
};

module.exports.getCountIndividual = async (memberJid, groupJid) => {
    await createCountMemberTable();
    let result = await pool.query(
        "SELECT count FROM countmember WHERE memberJid=$1 AND groupJid=$2;",
        [memberJid, groupJid]
    );
    if (result.rowCount) {
        return result.rows[0].count;
    } else {
        return 0;
    }
};

module.exports.getCountIndividualAllGroup = async (memberJid) => {
    await createCountMemberTable();
    let result = await pool.query(
        "SELECT SUM(count) as count FROM countmember WHERE memberJid=$1;",
        [memberJid]
    );
    if (result.rowCount) {
        return result.rows[0].count;
    } else {
        return 0;
    }
};

module.exports.getCountIndividualAllGroupWithName = async (memberJid) => {
    await createCountMemberTable();
    let result = await pool.query(
        "SELECT countmember.memberjid,groupname.gname,countmember.count FROM countmember,groupname WHERE countmember.groupjid=groupname.groupjid and memberjid=$1 ORDER BY count DESC;",
        [memberJid]
    );
    if (result.rowCount) {
        return result.rows;
    } else {
        return [];
    }
};

module.exports.getCountTop = async () => {
    await createCountMemberTable();
    let result = await pool.query(
        "SELECT DISTINCT memberJid,SUM(count) as count FROM countmember GROUP BY memberJid ORDER BY count DESC LIMIT 20;"
    );
    if (result.rowCount) {
        return result.rows;
    } else {
        return [];
    }
};

module.exports.getCountGroups = async () => {
    await createCountMemberTable();
    let result = await pool.query(
        "SELECT groupJid,SUM(count) as count FROM countmember GROUP BY groupJid ORDER BY count DESC;"
    );
    if (result.rowCount) {
        return result.rows;
    } else {
        return [];
    }
};

module.exports.setCountMember = async (memberJid, groupJid, name) => {
    if (!groupJid.endsWith("@g.us")) return;

    //check if groupjid is present in DB or not
    let result;
    try {
        result = await pool.query(
            "select * from countmember WHERE memberjid=$1 AND groupjid=$2;",
            [memberJid, groupJid]
        );
    } catch (err) {
        await createCountMemberTable();
        result = await pool.query(
            "select * from countmember WHERE memberjid=$1 AND groupjid=$2;",
            [memberJid, groupJid]
        );
    }

    //present
    if (result.rows.length) {
        let count = result.rows[0].count;

        await pool.query(
            "UPDATE countmember SET count = count+1 WHERE memberjid=$1 AND groupjid=$2;",
            [memberJid, groupJid]
        );
    } else {
        await pool.query("INSERT INTO countmember VALUES($1,$2,$3);", [
            memberJid,
            groupJid,
            1,
        ]);
    }
    await pool.query("commit;");

    let resultName;
    try {
        resultName = await pool.query(
            "select * from countmembername WHERE memberjid=$1;",
            [memberJid]
        );
    } catch (err) {
        await createCountMemberNameTable();
        resultName = await pool.query(
            "select * from countmembername WHERE memberjid=$1;",
            [memberJid]
        );
    }

    //present
    if (resultName.rows.length) {
        await pool.query(
            "UPDATE countmembername SET name = $1 WHERE memberjid=$2;",
            [name, groupJid]
        );
    } else {
        await pool.query("INSERT INTO countmembername VALUES($1,$2);", [
            memberJid,
            name,
        ]);
    }
    await pool.query("commit;");
};