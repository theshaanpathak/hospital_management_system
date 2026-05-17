const express = require('express');
const router = express.Router();
const db = require('../config/db');

console.log("✅ Patient Routes Loaded");


// ==================================================
// GET PATIENT BY USER ID (QUERY VERSION - EXISTING)
// ==================================================
router.get('/me', (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ message: "user_id is required" });
  }

  const sql = `
    SELECT id AS patient_id
    FROM patients
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("❌ /me Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ patient_id: result[0].patient_id });
  });
});


// ==================================================
// GET PATIENT BY USER ID (PARAM VERSION - USED BY FRONTEND)
// ==================================================
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const sql = `
    SELECT id AS patient_id
    FROM patients
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("❌ /user/:userId Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ patient_id: result[0].patient_id });
  });
});


// ==================================================
// GET ALL PATIENTS
// ==================================================
router.get('/all', (req, res) => {
  const sql = `
    SELECT 
      p.id AS patient_id,
      u.name
    FROM patients p
    INNER JOIN users u ON p.user_id = u.id
    ORDER BY u.name ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Get Patients Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});


// ==================================================
// DELETE PATIENT + USER (SAFE CASCADE)
// ==================================================
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Patient ID is required" });
  }

  const getUserSql = "SELECT user_id FROM patients WHERE id = ?";

  db.query(getUserSql, [id], (err, result) => {
    if (err) {
      console.error("❌ Fetch Patient Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const userId = result[0].user_id;

    // Delete patient first
    db.query("DELETE FROM patients WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("❌ Delete Patient Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      // Then delete user
      db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
        if (err) {
          console.error("❌ Delete User Error:", err);
          return res.status(500).json({ message: "Database error" });
        }

        res.json({
          message: "Patient and user deleted successfully"
        });
      });
    });
  });
});


// ==================================================
// EXPORT ROUTER
// ==================================================
module.exports = router;