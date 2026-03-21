const express = require('express');
const router = express.Router();
const db = require('../config/db');

console.log("✅ Appointment Routes Loaded");



// ----------------------
// DEBUG: raw data
// ----------------------
router.get('/debug/raw', (req, res) => {
  db.query("SELECT * FROM appointments", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// ----------------------
// ADD APPOINTMENT (NEW)
// ----------------------
router.post('/', (req, res) => {
  console.log("🔥 POST /api/appointments HIT"); // ADD THIS
  const { patient_id, doctor_id, date } = req.body;

  console.log("📥 Incoming Data:", req.body); // 👈 ADD THIS

  if (!patient_id || !doctor_id || !date) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = `
    INSERT INTO appointments (patient_id, doctor_id, date, status)
    VALUES (?, ?, ?, 'pending')
  `;

  db.query(sql, [patient_id, doctor_id, date], (err, result) => {
    if (err) {
      console.error("❌ Insert Error FULL:", err); // 👈 IMPORTANT
      return res.status(500).json({
      message: "Database error",
      error: err.message
      });
    }

    res.json({
      message: "Appointment booked successfully",
      appointment_id: result.insertId
    });
  });
});
// ----------------------
// GET ALL APPOINTMENTS
// ----------------------
router.get('/', (req, res) => {
  const sql = `
    SELECT a.*, 
           u1.name AS patient_name,
           u2.name AS doctor_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users u1 ON p.user_id = u1.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN users u2 ON d.user_id = u2.id
    ORDER BY a.date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Fetch Error:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

router.get('/patient/:patientId', (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT a.*, 
           u2.name AS doctor_name
    FROM appointments a
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN users u2 ON d.user_id = u2.id
    WHERE a.patient_id = ?
    ORDER BY a.date DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// ----------------------
// GET APPOINTMENTS BY DOCTOR
// ----------------------
router.get('/doctor/:doctorId', (req, res) => {
  const { doctorId } = req.params;

  const sql = `
    SELECT a.*, 
           u1.name AS patient_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users u1 ON p.user_id = u1.id
    WHERE a.doctor_id = ?
    ORDER BY a.date DESC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

module.exports = router;