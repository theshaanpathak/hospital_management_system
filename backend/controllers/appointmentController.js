const db = require('../config/db');

/**
 * @desc    Book an appointment with intake details (Transaction-safe)
 * @route   POST /api/appointments/book
 * @access  Private (Patient)
 */
exports.bookAppointment = async (req, res) => {
  console.log("📥 Incoming Booking Request:", req.body);
  console.log("📎 Attached File:", req.file ? req.file.filename : "No file");

  const { 
    patient_id, 
    doctor_id, 
    slot_id, 
    symptoms, 
    duration, 
    medical_history, 
    medications 
  } = req.body;

  const file = req.file ? req.file.filename : null;

  if (!patient_id || !doctor_id || !slot_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const connection = await db.promise().getConnection();
  try {
    // 1. Start Transaction
    await connection.beginTransaction();

    // 2. Select slot FOR UPDATE to lock the row and prevent concurrent booking
    const [slots] = await connection.query(
      "SELECT * FROM doctor_slots WHERE id = ? FOR UPDATE",
      [slot_id]
    );

    if (slots.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Slot not found" });
    }

    const slot = slots[0];

    // 3. Check if already booked or in the past
    if (slot.is_booked) {
      await connection.rollback();
      return res.status(400).json({ message: "Slot is already booked" });
    }

    const now = new Date();
    if (new Date(slot.slot_time) <= now) {
      await connection.rollback();
      return res.status(400).json({ message: "Cannot book a slot in the past" });
    }

    // 4. Update slot as booked
    await connection.query(
      "UPDATE doctor_slots SET is_booked = 1 WHERE id = ?",
      [slot_id]
    );

    // 5. Create appointment
    const [appointmentResult] = await connection.query(
      `INSERT INTO appointments (patient_id, doctor_id, date, status, slot_id)
       VALUES (?, ?, ?, 'pending', ?)`,
      [patient_id, doctor_id, slot.slot_time, slot_id]
    );

    const appointmentId = appointmentResult.insertId;

    // 6. Create appointment_details (Intake Form)
    // Mapping symptoms to notes as requested
    try {
      await connection.query(
        `INSERT INTO appointment_details 
         (appointment_id, notes, duration, medical_history, medications, attachment)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [appointmentId, symptoms || 'No symptoms described', duration || null, medical_history || null, medications || null, file]
      );
    } catch (dbErr) {
      console.warn("⚠️ Database schema might be outdated. Falling back to basic insert.");
      // Fallback: Only insert notes if columns like 'duration' are missing
      await connection.query(
        `INSERT INTO appointment_details (appointment_id, notes, attachment) VALUES (?, ?, ?)`,
        [appointmentId, `${symptoms} (Duration: ${duration})`, file]
      );
    }

    // 7. Commit Transaction
    await connection.commit();

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment_id: appointmentId,
      date: slot.slot_time
    });
  } catch (error) {
    // 8. Rollback on any failure
    await connection.rollback();
    console.error("❌ FULL BOOKING ERROR STACK:", error);
    res.status(500).json({ 
      message: "Booking failed. Check server console for details.",
      error: error.message 
    });
  } finally {
    // 9. Release connection back to pool
    connection.release();
  }
};

/**
 * @desc    Cancel an appointment and release the slot
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private (Patient/Doctor/Admin)
 */
exports.cancelAppointment = async (req, res) => {
  const { id } = req.params;

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get appointment and related slot
    const [appointments] = await connection.query(
      "SELECT * FROM appointments WHERE id = ? FOR UPDATE",
      [id]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointment = appointments[0];

    // 2. Prevent cancellation if already cancelled or completed
    if (appointment.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ message: "Appointment is already cancelled" });
    }

    // You might want to check if the date is in the past to prevent releasing slots for past appointments
    const isPast = new Date(appointment.date) < new Date();

    // 3. Update appointment status
    await connection.query(
      "UPDATE appointments SET status = 'cancelled' WHERE id = ?",
      [id]
    );

    // 4. Release slot if it exists and appointment is not in the past
    if (appointment.slot_id && !isPast) {
      await connection.query(
        "UPDATE doctor_slots SET is_booked = 0 WHERE id = ?",
        [appointment.slot_id]
      );
    }

    await connection.commit();
    res.json({ message: "Appointment cancelled and slot released" });
  } catch (error) {
    await connection.rollback();
    console.error("Cancellation Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Get all appointments with details
 */
exports.getAllAppointments = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT a.*, 
             u1.name AS patient_name,
             u2.name AS doctor_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u1 ON p.user_id = u1.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u2 ON d.user_id = u2.id
      ORDER BY a.date DESC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * @desc    Get appointments by Doctor
 */
exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT a.*, u1.name AS patient_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u1 ON p.user_id = u1.id
      WHERE a.doctor_id = ?
      ORDER BY a.date DESC
    `, [req.params.doctorId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * @desc    Get appointments by Patient
 */
exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT a.*, u.name AS doctor_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.date DESC
    `, [req.params.patientId]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * @desc    Update appointment status (Approve/Reject)
 * @route   PUT /api/appointments/:id/status
 */
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get the appointment to find the slot_id
    const [appointments] = await connection.query(
      "SELECT slot_id, date FROM appointments WHERE id = ? FOR UPDATE",
      [id]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Appointment not found" });
    }

    const { slot_id, date } = appointments[0];

    // 2. Update the status
    await connection.query(
      "UPDATE appointments SET status = ? WHERE id = ?",
      [status, id]
    );

    // 3. Handle Slot Lifecycle
    if (slot_id) {
      if (status === 'rejected' || status === 'cancelled') {
        // Release the slot so it can be booked again
        const isPast = new Date(date) < new Date();
        if (!isPast) {
          await connection.query(
            "UPDATE doctor_slots SET is_booked = 0 WHERE id = ?",
            [slot_id]
          );
        }
      } else if (status === 'approved') {
        // Permanently remove approved slots (as they are consumed)
        await connection.query(
          "DELETE FROM doctor_slots WHERE id = ?",
          [slot_id]
        );
      }
    }

    await connection.commit();
    res.json({ message: `Appointment status updated to ${status}` });
  } catch (error) {
    await connection.rollback();
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Save session details
 */
exports.saveDetails = async (req, res) => {
  const { appointmentId } = req.params;
  const { notes, prescription } = req.body;
  const file = req.file ? req.file.filename : null;

  try {
    const [results] = await db.promise().query(
      "SELECT id FROM appointment_details WHERE appointment_id = ?",
      [appointmentId]
    );

    if (results.length > 0) {
      await db.promise().query(
        `UPDATE appointment_details 
         SET notes=?, prescription=?, attachment=COALESCE(?, attachment)
         WHERE appointment_id=?`,
        [notes, prescription, file, appointmentId]
      );
    } else {
      await db.promise().query(
        `INSERT INTO appointment_details 
         (appointment_id, notes, prescription, attachment)
         VALUES (?, ?, ?, ?)`,
        [appointmentId, notes, prescription, file]
      );
    }
    res.json({ message: "Details saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * @desc    Get session details
 */
exports.getDetails = async (req, res) => {
  try {
    const [results] = await db.promise().query(
      "SELECT * FROM appointment_details WHERE appointment_id = ? ORDER BY id DESC LIMIT 1",
      [req.params.appointmentId]
    );
    res.json(results.length > 0 ? results[0] : null);
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};
