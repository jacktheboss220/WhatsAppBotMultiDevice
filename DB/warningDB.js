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
const createCountWarningTable = async () => {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS countwarning(memberjid text , groupjid text, count integer);"
  );
};

module.exports.getCountWarning = async (memberjid, groupJid) => {
  await createCountWarningTable();
  let result = await pool.query(
    "SELECT count FROM countwarning WHERE memberjid=$1 AND groupJid=$2;",
    [memberjid, groupJid]
  );
  if (result.rowCount) {
    return result.rows[0].count;
  } else {
    return 0;
  }
};

module.exports.setCountWarning = async (memberJid, groupJid) => {
  if (!groupJid.endsWith("@g.us")) return;
  await createCountWarningTable();

  //check if groupjid is present in DB or not
  let result = await pool.query(
    "select * from countwarning WHERE memberjid=$1 AND groupjid=$2;",
    [memberJid, groupJid]
  );

  //present
  if (result.rows.length) {
    let count = result.rows[0].count;

    await pool.query(
      "UPDATE countwarning SET count = count+1 WHERE memberjid=$1 AND groupjid=$2;",
      [memberJid, groupJid]
    );
    await pool.query("commit;");
    return count + 1;
  } else {
    await pool.query("INSERT INTO countwarning VALUES($1,$2,$3);", [
      memberJid,
      groupJid,
      1,
    ]);
    await pool.query("commit;");
    return 1;
  }
};

module.exports.removeWarnCount = async (memberJid, groupJid) => {
  if (!groupJid.endsWith("@g.us")) return;
  await createCountWarningTable();

  //check if groupjid is present in DB or not
  let result = await pool.query(
    "select * from countwarning WHERE memberjid=$1 AND groupjid=$2;",
    [memberJid, groupJid]
  );

  //present
  if (result.rows.length) {
    let count = result.rows[0].count;
    await pool.query(
      "UPDATE countwarning SET count = 0 WHERE memberjid=$1 AND groupjid=$2;",
      [memberJid, groupJid]
    );
    await pool.query("commit;");
    return count;
  } else {
    await pool.query("INSERT INTO countwarning VALUES($1,$2,$3);", [
      memberJid,
      groupJid,
      0,
    ]);
    await pool.query("commit;");
    return 1;
  }
};
