const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = "mysecretkey";

// ----------------------
// REGISTER
// ----------------------
router.post('/register', async (req, res) => {
  const { name, email, password, role, age, gender, specialization } = req.body;

  // ✅ Basic validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All required fields must be filled" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const userSql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

    db.query(userSql, [name, email, hashedPassword, role], (err, result) => {
      if (err) {
        console.error("User Insert Error:", err);
        return res.status(500).json({ message: "Database error (users)" });
      }

      const userId = result.insertId;

      // ----------------------
      // Insert into patients
      // ----------------------
      if (role === 'patient') {
        if (!age || !gender) {
          return res.status(400).json({ message: "Age and gender required for patient" });
        }

        const patientSql = "INSERT INTO patients (user_id, age, gender) VALUES (?, ?, ?)";

        db.query(patientSql, [userId, age, gender], (err) => {
          if (err) {
            console.error("Patient Insert Error:", err);
            return res.status(500).json({ message: "Database error (patients)" });
          }

          return res.json({ message: "Patient registered successfully" });
        });
      }

      // ----------------------
      // Insert into doctors
      // ----------------------
      else if (role === 'doctor') {
        if (!specialization) {
          return res.status(400).json({ message: "Specialization required for doctor" });
        }

        const doctorSql = "INSERT INTO doctors (user_id, specialization) VALUES (?, ?)";

        db.query(doctorSql, [userId, specialization], (err) => {
          if (err) {
            console.error("Doctor Insert Error:", err);
            return res.status(500).json({ message: "Database error (doctors)" });
          }

          return res.json({ message: "Doctor registered successfully" });
        });
      }

      // ----------------------
      // Admin or fallback
      // ----------------------
      else {
        return res.json({ message: "User registered successfully" });
      }

    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// LOGIN
// ----------------------
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Login DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error("Password Compare Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
});

module.exports = router;