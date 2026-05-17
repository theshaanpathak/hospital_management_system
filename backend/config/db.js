const mysql = require('mysql2');

// ==================================================
// CREATE CONNECTION POOL (IMPORTANT FIX)
// ==================================================
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // put your MySQL password if any
  database: 'hms',

  // ✅ recommended for stability
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==================================================
// TEST CONNECTION (optional but useful)
// ==================================================
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }

  console.log('MySQL Connected ✅');

  // release test connection back to pool
  connection.release();
});

// ==================================================
// EXPORT POOL (NOT SINGLE CONNECTION)
// ==================================================
module.exports = db;
