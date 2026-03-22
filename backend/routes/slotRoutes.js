const express = require('express');
const router = express.Router();
const db = require('../config/db');

console.log("✅ Slot Routes Loaded");

// ADD SLOT
router.post('/', (req, res) => {
  const { doctor_id, slot_time } = req.body;

  if (!doctor_id || !slot_time) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const sql = `
    INSERT INTO doctor_slots (doctor_id, slot_time)
    VALUES (?, ?)
  `;

  db.query(sql, [doctor_id, slot_time], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Slot added", slot_id: result.insertId });
  });
});

// GET ALL SLOTS (NO FILTER)
router.get('/:doctorId', (req, res) => {
  const { doctorId } = req.params;

  const sql = `
    SELECT * FROM doctor_slots
    WHERE doctor_id = ?
    ORDER BY slot_time
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// DELETE SLOT
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM doctor_slots WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ message: "Deleted" });
  });
});

// ✅ FIX (ONLY THIS LINE ADDED)
module.exports = router;