const mysql = require('mysql2');
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hms'
});

async function checkSlots() {
  try {
    const [rows] = await db.promise().query("SELECT * FROM doctor_slots");
    console.log("Total Slots in DB:", rows.length);
    if (rows.length > 0) {
      console.log("Sample Slots:", rows.slice(0, 5));
      const now = new Date();
      const futureSlots = rows.filter(r => new Date(r.slot_time) > now);
      console.log("Future Slots:", futureSlots.length);
    }
    process.exit(0);
  } catch (err) {
    console.error("DB Error:", err);
    process.exit(1);
  }
}

checkSlots();
