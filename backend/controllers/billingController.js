const db = require('../config/db');

// ==================================================
// CREATE BILL
// ==================================================
exports.createBill = (req, res) => {
  try {
    const { patient_id, appointment_id, amount, payment_method } = req.body;

    const doctor_id = req.user?.id || null;

    // ✅ Validation
    if (!patient_id || !appointment_id || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // ✅ Check appointment exists
    db.query(
      "SELECT * FROM appointments WHERE id = ?",
      [appointment_id],
      (err, appointmentResult) => {
        if (err) {
          console.error("❌ Appointment Check Error:", err);
          return res.status(500).json({ message: "Database error" });
        }

        if (appointmentResult.length === 0) {
          return res.status(404).json({ message: "Appointment not found" });
        }

        // ✅ Prevent duplicate bill
        db.query(
          "SELECT * FROM bills WHERE appointment_id = ?",
          [appointment_id],
          (err, existingBill) => {
            if (err) {
              console.error("❌ Duplicate Check Error:", err);
              return res.status(500).json({ message: "Database error" });
            }

            if (existingBill.length > 0) {
              return res.status(400).json({
                message: "Bill already exists for this appointment"
              });
            }

            // ✅ Insert bill
            const sql = `
              INSERT INTO bills 
              (patient_id, appointment_id, amount, status, payment_method, created_by_doctor_id)
              VALUES (?, ?, ?, 'pending', ?, ?)
            `;

            db.query(
              sql,
              [patient_id, appointment_id, amount, payment_method || null, doctor_id],
              (err, result) => {
                if (err) {
                  console.error("❌ CreateBill Error:", err);
                  return res.status(500).json({ message: "Database error" });
                }

                return res.status(201).json({
                  message: "Bill created successfully",
                  bill_id: result.insertId
                });
              }
            );
          }
        );
      }
    );

  } catch (error) {
    console.error("❌ CreateBill Server Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// ==================================================
// GET BILLS BY PATIENT
// ==================================================
exports.getPatientBills = (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({ message: "Patient ID is required" });
  }

  const sql = `
    SELECT 
      b.id,
      b.amount,
      b.status,
      b.payment_method,
      b.created_at,
      a.date AS appointment_date
    FROM bills b
    INNER JOIN appointments a ON b.appointment_id = a.id
    WHERE b.patient_id = ?
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("❌ getPatientBills Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json(results);
  });
};


// ==================================================
// GET ALL BILLS
// ==================================================
exports.getAllBills = (req, res) => {
  const sql = `
    SELECT 
      b.id,
      b.amount,
      b.status,
      b.payment_method,
      b.created_at,
      u.name AS patient_name
    FROM bills b
    INNER JOIN patients p ON b.patient_id = p.id
    INNER JOIN users u ON p.user_id = u.id
    ORDER BY b.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ getAllBills Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json(results);
  });
};


// ==================================================
// GET BILLS BY DOCTOR
// ==================================================
exports.getDoctorBills = (req, res) => {
  const { doctorId } = req.params;

  if (!doctorId) {
    return res.status(400).json({ message: "Doctor ID is required" });
  }

  const sql = `
    SELECT 
      b.id,
      b.amount,
      b.status,
      b.payment_method,
      b.created_at,
      u.name AS patient_name
    FROM bills b
    INNER JOIN appointments a ON b.appointment_id = a.id
    INNER JOIN patients p ON b.patient_id = p.id
    INNER JOIN users u ON p.user_id = u.id
    WHERE a.doctor_id = ?
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error("❌ getDoctorBills Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json(results);
  });
};


// ==================================================
// VERIFY BILL (NEW)
// ==================================================
exports.verifyBill = (req, res) => {
  const { id } = req.params;

  // ✅ Only allow verify if pending
  db.query(
    "SELECT status FROM bills WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("❌ verifyBill Fetch Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Bill not found" });
      }

      if (result[0].status !== 'pending') {
        return res.status(400).json({
          message: "Only pending bills can be verified"
        });
      }

      db.query(
        "UPDATE bills SET status = 'verified' WHERE id = ?",
        [id],
        (err) => {
          if (err) {
            console.error("❌ verifyBill Error:", err);
            return res.status(500).json({ message: "Database error" });
          }

          res.json({ message: "Bill verified successfully" });
        }
      );
    }
  );
};


// ==================================================
// PAY BILL
// ==================================================
exports.payBill = (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body;

  const allowedMethods = ['cash', 'card', 'upi'];

  if (!id || !payment_method) {
    return res.status(400).json({ message: "Payment details are required" });
  }

  if (!allowedMethods.includes(payment_method)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  // ✅ Only allow payment if verified
  db.query(
    "SELECT status FROM bills WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("❌ payBill Fetch Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Bill not found" });
      }

      if (result[0].status !== 'verified') {
        return res.status(400).json({
          message: "Bill must be verified before payment"
        });
      }

      db.query(
        `UPDATE bills
         SET status = 'paid',
             payment_method = ?
         WHERE id = ?`,
        [payment_method, id],
        (err) => {
          if (err) {
            console.error("❌ payBill Error:", err);
            return res.status(500).json({ message: "Database error" });
          }

          res.json({ message: "Payment successful" });
        }
      );
    }
  );
};