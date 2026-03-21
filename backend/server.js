const express = require('express');
const cors = require('cors');

const app = express();
console.log("✅ Registering /api/appointments routes");
// ----------------------
// Middleware
// ----------------------
app.use(cors());
app.use(express.json());

// ----------------------
// DB Connection
// ----------------------
require('./config/db');

// ----------------------
// Health Check
// ----------------------
app.get('/', (req, res) => {
  res.send('Server running and DB connected');
});

// ----------------------
// Load Routes (DEBUG SAFE)
// ----------------------
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

// 🔍 Debug (VERY IMPORTANT)
console.log("authRoutes:", typeof authRoutes);
console.log("patientRoutes:", typeof patientRoutes);
console.log("doctorRoutes:", typeof doctorRoutes);
console.log("appointmentRoutes:", typeof appointmentRoutes);

// ----------------------
// Use Routes
// ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// ----------------------
// 404 Handler
// ----------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ----------------------
// Global Error Handler
// ----------------------
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ----------------------
// Start Server
// ----------------------
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});