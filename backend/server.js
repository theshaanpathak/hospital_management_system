
const express = require('express');
const cors = require('cors');

const app = express(); // ✅ MUST come first

// ----------------------
// Middleware
// ----------------------
app.use(cors());
app.use(express.json());

// ✅ ADD THIS (serve uploaded files)
app.use('/uploads', express.static('uploads'));

// ----------------------
// GLOBAL REQUEST LOGGER
// ----------------------
app.use((req, res, next) => {
  console.log("👉 Incoming:", req.method, req.url);
  next();
});

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
// Load Routes
// ----------------------
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const slotRoutes = require('./routes/slotRoutes');

// ----------------------
// Debug Route Loading
// ----------------------
console.log("✅ authRoutes:", typeof authRoutes);
console.log("✅ patientRoutes:", typeof patientRoutes);
console.log("✅ doctorRoutes:", typeof doctorRoutes);
console.log("✅ appointmentRoutes:", typeof appointmentRoutes);
console.log("✅ slotRoutes:", typeof slotRoutes);

// ----------------------
// Register Routes
// ----------------------
console.log("🚀 Registering Routes...");

app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/slots', slotRoutes);

// ----------------------
// TEST ROUTE
// ----------------------
app.get('/test', (req, res) => {
  res.send("✅ Test route working");
});

// ----------------------
// 404 Handler (LAST)
// ----------------------
app.use((req, res) => {
  console.log("❌ 404 HIT:", req.method, req.url);
  res.status(404).json({ message: "Route not found" });
});

// ----------------------
// Global Error Handler
// ----------------------
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ----------------------
// Start Server
// ----------------------
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

