const db = require('../config/db');

/**
 * @desc    Generate available slots for a doctor
 * @route   POST /api/slots/generate
 * @access  Private (Doctor/Admin)
 */
exports.generateSlots = async (req, res) => {
  const { doctor_id, date, start_time, end_time, interval_minutes } = req.body;

  if (!doctor_id || !date || !start_time || !end_time || !interval_minutes) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    const start = new Date(`${date}T${start_time}`);
    const end = new Date(`${date}T${end_time}`);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({ message: "Cannot generate slots for the past" });
    }

    if (start >= end) {
      return res.status(400).json({ message: "Start time must be before end time" });
    }

    const slots = [];
    let current = new Date(start);

    while (current < end) {
      const next = new Date(current.getTime() + interval_minutes * 60000);
      if (next > end) break;

      slots.push(new Date(current));
      current = next;
    }

    // Check for overlaps in the database
    // We check if any existing slot for this doctor falls within the [start, end] range
    const [existing] = await connection.query(
      "SELECT slot_time FROM doctor_slots WHERE doctor_id = ? AND slot_time >= ? AND slot_time < ?",
      [doctor_id, start, end]
    );

    const existingTimes = existing.map(s => new Date(s.slot_time).getTime());
    const newSlots = slots.filter(s => !existingTimes.includes(s.getTime()));

    if (newSlots.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Slots already exist or overlap with existing ones" });
    }

    const values = newSlots.map(s => [doctor_id, s]);
    await connection.query(
      "INSERT INTO doctor_slots (doctor_id, slot_time) VALUES ?",
      [values]
    );

    await connection.commit();
    res.status(201).json({
      message: `${newSlots.length} slots generated successfully`,
      generated_slots: newSlots
    });
  } catch (error) {
    await connection.rollback();
    console.error("Slot Generation Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Get available slots for a doctor on a specific date
 * @route   GET /api/slots/available
 * @access  Public
 */
exports.getAvailableSlots = async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return res.status(400).json({ message: "Doctor ID and Date are required" });
  }

  try {
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);
    const now = new Date();

    const [slots] = await db.promise().query(
      `SELECT id, slot_time FROM doctor_slots 
       WHERE doctor_id = ? 
       AND slot_time >= ? 
       AND slot_time <= ? 
       AND is_booked = 0 
       AND slot_time > ?
       ORDER BY slot_time ASC`,
      [doctorId, startOfDay, endOfDay, now]
    );

    res.json(slots);
  } catch (error) {
    console.error("Get Available Slots Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc    Get all slots for a doctor (Admin/Doctor view)
 */
exports.getDoctorSlots = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const [slots] = await db.promise().query(
      "SELECT * FROM doctor_slots WHERE doctor_id = ? ORDER BY slot_time DESC",
      [doctorId]
    );
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: "Database error" });
  }
};

/**
 * @desc    Delete a slot
 */
exports.deleteSlot = async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.promise().query(
      "SELECT is_booked FROM doctor_slots WHERE id = ?",
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (results[0].is_booked) {
      return res.status(400).json({ message: "Cannot delete a booked slot" });
    }

    await db.promise().query("DELETE FROM doctor_slots WHERE id = ?", [id]);
    res.json({ message: "Slot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

/**
 * @desc    Get slots grouped by month and date
 * @route   GET /api/slots/monthly
 * @access  Public
 */
exports.getMonthlySlots = async (req, res) => {
  const { doctorId, year, month } = req.query;

  if (!doctorId || !year || !month) {
    return res.status(400).json({ message: "Doctor ID, Year, and Month are required" });
  }

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const now = new Date();

    const [slots] = await db.promise().query(
      `SELECT id, slot_time, is_booked 
       FROM doctor_slots 
       WHERE doctor_id = ? 
       AND slot_time >= ? 
       AND slot_time <= ? 
       AND slot_time > ?
       ORDER BY slot_time ASC`,
      [doctorId, startDate, endDate, now]
    );

    // Grouping by date: YYYY-MM-DD
    const groupedSlots = slots.reduce((acc, slot) => {
      const dateKey = new Date(slot.slot_time).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        slot_id: slot.id,
        time: new Date(slot.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_booked: !!slot.is_booked
      });
      return acc;
    }, {});

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    res.json({
      [monthKey]: groupedSlots
    });
  } catch (error) {
    console.error("Monthly Slots Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
