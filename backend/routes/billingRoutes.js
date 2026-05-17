const express = require('express');
const router = express.Router();

const billingController = require('../controllers/billingController');

// ==================================================
// CREATE BILL
// ==================================================
router.post('/', billingController.createBill);

// ==================================================
// GET ALL BILLS (ADMIN)
// ⚠️ Keep BEFORE dynamic routes
// ==================================================
router.get('/', billingController.getAllBills);

// ==================================================
// GET BILLS BY PATIENT
// ==================================================
router.get('/patient/:patientId', billingController.getPatientBills);

// ==================================================
// GET BILLS BY DOCTOR (OPTIONAL - RECOMMENDED)
// ==================================================
router.get('/doctor/:doctorId', billingController.getDoctorBills);

// ==================================================
// ✅ VERIFY BILL (ADDED FIX)
// ==================================================
router.put('/verify/:id', billingController.verifyBill);

// ==================================================
// PAY BILL
// ==================================================
router.put('/pay/:id', billingController.payBill);

// ==================================================
// DEBUG ROUTE (for testing)
// ==================================================
router.get('/test', (req, res) => {
  res.json({
    message: "Billing route working ✅",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;