
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ----------------------
// Get Patient by user_id
// ----------------------
router.get('/me', (req, res) => {
  const userId = req.query.user_id;

  // ❗ Validate input
  if (!userId) {
    return res.status(400).json({ message: "user_id is required" });
  }

  const sql = "SELECT id FROM patients WHERE user_id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ patient_id: result[0].id });
  });
});

// ----------------------
// ✅ ADDED: GET ALL PATIENTS
// ----------------------
router.get('/all', (req, res) => {
  const sql = `
    SELECT p.id, u.name
    FROM patients p
    JOIN users u ON p.user_id = u.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Get Patients Error:", err);
      return res.status(500).json(err);
    }

    res.json(results);
  });
});

// ----------------------
// ✅ ADDED: DELETE PATIENT
// ----------------------


router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Step 1: get user_id
  db.query("SELECT user_id FROM patients WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const userId = result[0].user_id;

    // Step 2: delete patient (cascade handles rest)
    db.query("DELETE FROM patients WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json(err);

      // Step 3: delete user
      db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "Patient + user deleted successfully" });
      });
    });
  });
});



// ----------------------
// Export Router (IMPORTANT)
// ----------------------
module.exports = router;

