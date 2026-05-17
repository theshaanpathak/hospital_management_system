const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');

// Generate slots (Doctor/Admin)
router.post('/generate', slotController.generateSlots);

// Monthly view for booking
router.get('/monthly', slotController.getMonthlySlots);

// Get available slots for a doctor on a date (Public/Patient)
router.get('/available', slotController.getAvailableSlots);

// Get all slots for a doctor (Admin/Doctor view)
router.get('/:doctorId', slotController.getDoctorSlots);

// Add a single slot (legacy support if needed)
// For now, I'll keep the POST / for single slot if the frontend expects it
// But generate is preferred.
router.post('/', async (req, res) => {
    // Basic single slot add - can also be refactored into controller
    const { doctor_id, slot_time } = req.body;
    const db = require('../config/db');
    db.query("INSERT INTO doctor_slots (doctor_id, slot_time) VALUES (?, ?)", [doctor_id, slot_time], (err) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: "Slot added" });
    });
});

// Delete slot
router.delete('/:id', slotController.deleteSlot);

module.exports = router;