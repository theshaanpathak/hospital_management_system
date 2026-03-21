const express = require('express');
const router = express.Router();
const db = require('../config/db');

console.log("✅ Doctor Routes Loaded");

// ----------------------
// Get all doctors
// ----------------------
router.get('/', (req, res) => {
  const sql = `
    SELECT d.id, u.name, d.specialization
    FROM doctors d
    JOIN users u ON d.user_id = u.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ DB Error (get doctors):", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.json(results);
  });
});

// ----------------------
// Get doctor_id by user_id
// ----------------------
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;

  // ✅ validation
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  const sql = "SELECT id FROM doctors WHERE user_id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("❌ DB Error (get doctor by user):", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      doctor_id: result[0].id
    });
  });
});

// ----------------------
// Export Router
// ----------------------
module.exports = router;