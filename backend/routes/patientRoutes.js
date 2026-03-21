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
// Export Router (IMPORTANT)
// ----------------------
module.exports = router;