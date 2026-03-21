const express = require('express');
const router = express.Router();
const db = require('../config/db');

console.log("✅ Appointment Routes Loaded");


// ----------------------
// DEBUG: raw data
// ----------------------
router.get('/debug/raw', (req, res) => {
  db.query("SELECT * FROM appointments", (err, results) => {
    if (err) {
      console.error("❌ Debug Error:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});


// ----------------------
// ADD APPOINTMENT
// ----------------------
router.post('/', (req, res) => {
  const { patient_id, doctor_id, slot_id } = req.body;

  const getSlot = `SELECT * FROM doctor_slots WHERE id = ?`;

  db.query(getSlot, [slot_id], (err, slotRes) => {
    if (err) return res.status(500).json(err);

    const slot = slotRes[0];

    if (!slot || slot.is_booked) {
      return res.status(400).json({ message: "Slot not available" });
    }

    const insert = `
      INSERT INTO appointments (patient_id, doctor_id, date, status, slot_id)
      VALUES (?, ?, ?, 'pending', ?)
    `;

    db.query(
      insert,
      [patient_id, doctor_id, slot.slot_time, slot_id],
      (err, result) => {
        if (err) return res.status(500).json(err);

        // mark slot booked
        db.query(
          `UPDATE doctor_slots SET is_booked = TRUE WHERE id = ?`,
          [slot_id]
        );

        res.json({ message: "Appointment booked via slot" });
      }
    );
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
      console.error("❌ Fetch Error:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});


// ----------------------
// GET APPOINTMENTS BY PATIENT
// ----------------------
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
    if (err) {
      console.error("❌ Patient Fetch Error:", err);
      return res.status(500).json(err);
    }
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
      console.error("❌ Doctor Fetch Error:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});


// ----------------------
// UPDATE APPOINTMENT STATUS (APPROVE / REJECT)
// ----------------------
router.put('/:id/status', (req, res) => {
  console.log("🔥 STATUS ROUTE HIT");

  const appointmentId = req.params.id;
  const { status } = req.body;

  console.log("📥 Status Update:", appointmentId, status);

  // Validate input
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const sql = `UPDATE appointments SET status = ? WHERE id = ?`;

  db.query(sql, [status, appointmentId], (err, result) => {
    if (err) {
      console.error("❌ Update Error:", err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Check if appointment exists
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment updated successfully',
      appointmentId,
      newStatus: status
    });
  });
});


module.exports = router;