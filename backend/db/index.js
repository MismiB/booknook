const { Pool, types } = require('pg');
require('dotenv').config();

// DATE columns (OID 1082) have no time or timezone component. Left to pg's
// default parsing, they're converted to a local-midnight JS Date object, which
// then shifts to the previous day when serialized/displayed in a timezone
// behind UTC. Returning the raw "YYYY-MM-DD" string sidesteps that entirely.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;