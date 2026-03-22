
const express = require('express');
const router = express.Router();
const db = require('../config/db');

const upload = require('../middleware/upload');

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
      (err) => {
        if (err) return res.status(500).json(err);

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
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});


// ----------------------
// ✅ ADDED: GET APPOINTMENTS BY PATIENT
// ----------------------
router.get('/patient/:patientId', (req, res) => {
  const { patientId } = req.params;

  const sql = `
    SELECT a.*, 
           u.name AS doctor_name
    FROM appointments a
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN users u ON d.user_id = u.id
    WHERE a.patient_id = ?
    ORDER BY a.date DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("❌ Patient Appointment Error:", err);
      return res.status(500).json(err);
    }

    res.json(results);
  });
});


// ----------------------
// SESSION DETAILS
// ----------------------
router.post('/details/:appointmentId', upload.single('file'), (req, res) => {
  const { appointmentId } = req.params;
  const { notes, prescription } = req.body;
  const file = req.file ? req.file.filename : null;

  const checkSql = `SELECT * FROM appointment_details WHERE appointment_id = ?`;

  db.query(checkSql, [appointmentId], (err, results) => {
    if (results.length > 0) {
      const updateSql = `
        UPDATE appointment_details 
        SET notes = ?, prescription = ?, 
            attachment = COALESCE(?, attachment)
        WHERE appointment_id = ?
      `;

      db.query(updateSql, [notes, prescription, file, appointmentId], () => {
        res.json({ message: "Updated successfully" });
      });
    } else {
      const insertSql = `
        INSERT INTO appointment_details 
        (appointment_id, notes, prescription, attachment)
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertSql, [appointmentId, notes, prescription, file], () => {
        res.json({ message: "Saved successfully" });
      });
    }
  });
});


// ----------------------
// GET SESSION DETAILS
// ----------------------
router.get('/details/:appointmentId', (req, res) => {
  const { appointmentId } = req.params;

  db.query(
    "SELECT * FROM appointment_details WHERE appointment_id = ? ORDER BY id DESC LIMIT 1",
    [appointmentId],
    (err, results) => {
      if (results.length === 0) return res.json(null);
      res.json(results[0]);
    }
  );
});


// ----------------------
// UPDATE STATUS
// ----------------------
router.put('/:id/status', (req, res) => {
  const { status } = req.body;

  db.query(
    "UPDATE appointments SET status = ? WHERE id = ?",
    [status, req.params.id],
    () => res.json({ message: "Updated" })
  );
});


module.exports = router;

