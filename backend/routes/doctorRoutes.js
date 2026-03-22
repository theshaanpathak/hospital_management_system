
const express = require('express');
const router = express.Router();
const db = require('../config/db');

console.log("✅ Doctor Routes Loaded");

// ----------------------
// Get all doctors
// ----------------------
router.get('/', (req, res) => {
  const sql = `
    SELECT d.*, u.name
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
// Get Approved Appointments for Doctor
// ----------------------
router.get('/:doctorId/approved-appointments', (req, res) => {
  const { doctorId } = req.params;

  if (!doctorId || isNaN(doctorId)) {
    return res.status(400).json({ message: "Invalid doctorId" });
  }

  const sql = `
    SELECT 
      a.id,
      a.date,
      a.status,
      p.id AS patient_id,
      u.name AS patient_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE a.doctor_id = ? AND a.status = 'approved'
    ORDER BY a.date DESC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("❌ DB Error (approved appointments):", err);
      return res.status(500).json({
        message: "Database error",
        error: err.message
      });
    }

    res.json(results);
  });
});

// ----------------------
// DELETE DOCTOR
// ----------------------

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Step 1: get user_id
  db.query("SELECT user_id FROM doctors WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const userId = result[0].user_id;

    // Step 2: delete doctor (cascade handles slots, appointments, etc.)
    db.query("DELETE FROM doctors WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json(err);

      // Step 3: delete user
      db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).json(err);

        res.json({ message: "Doctor + user deleted successfully" });
      });
    });
  });
});



// ----------------------
// UPDATE DOCTOR PROFILE (EXTENDED)
// ----------------------
router.put('/:id', (req, res) => {
  console.log("👉 UPDATE BODY:", req.body); // ✅ DEBUG

  const { id } = req.params;

  const {
    name,
    specialization,
    phone,
    experience,
    qualification,
    bio
  } = req.body;

  const updateDoctor = `
    UPDATE doctors 
    SET specialization = ?, 
        phone = ?, 
        experience = ?, 
        qualification = ?, 
        bio = ?
    WHERE id = ?
  `;

  db.query(
    updateDoctor,
    [
      specialization || null,
      phone || null,
      experience || null,
      qualification || null,
      bio || null,
      id
    ],
    (err) => {
      if (err) {
        console.error("❌ Doctor Update Error:", err);
        return res.status(500).json(err);
      }

      const updateUser = `
        UPDATE users SET name = ?
        WHERE id = (SELECT user_id FROM doctors WHERE id = ?)
      `;

      db.query(updateUser, [name, id], (err) => {
        if (err) {
          console.error("❌ User Update Error:", err);
          return res.status(500).json(err);
        }

        res.json({ message: "Profile updated" });
      });
    }
  );
});

router.get('/profile/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT d.*, u.name
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(results[0]);
  });
});

// ----------------------
// Export Router
// ----------------------
module.exports = router;

