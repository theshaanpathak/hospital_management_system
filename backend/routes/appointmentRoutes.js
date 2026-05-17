const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const upload = require('../middleware/upload');

// Book appointment with intake details (Transaction-safe)
router.post('/book', upload.single('file'), appointmentController.bookAppointment);

// Legacy POST / support
router.post('/', upload.single('file'), appointmentController.bookAppointment);

// Get all
router.get('/', appointmentController.getAllAppointments);

// Get by doctor/patient
router.get('/doctor/:doctorId', appointmentController.getAppointmentsByDoctor);
router.get('/patient/:patientId', appointmentController.getAppointmentsByPatient);

// Session details
router.post('/details/:appointmentId', upload.single('file'), appointmentController.saveDetails);
router.get('/details/:appointmentId', appointmentController.getDetails);

// Cancel appointment
router.put('/:id/cancel', appointmentController.cancelAppointment);

// Update status
router.put('/:id/status', appointmentController.updateStatus);

// Approve (legacy support)
router.put('/:id/approve', appointmentController.updateStatus);

module.exports = router;