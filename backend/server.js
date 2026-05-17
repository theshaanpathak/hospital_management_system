const express = require('express');
const cors = require('cors');

const app = express();

// ----------------------
// Middleware
// ----------------------
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ----------------------
// Request Logger
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
// Routes
// ----------------------
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const slotRoutes = require('./routes/slotRoutes');
const billingRoutes = require('./routes/billingRoutes');
const chatRoutes = require('./routes/chatRoutes');

// ----------------------
// Route Mounting
// ----------------------
app.use('/api/auth', authRoutes);

// ✅ FIXED (plural)
app.use('/api/patients', patientRoutes);

app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bills', billingRoutes);
app.use('/api/chat', chatRoutes);

// ----------------------
// Health Check
// ----------------------
app.get('/', (req, res) => {
  res.send('Server running and DB connected');
});

app.get('/test', (req, res) => {
  res.send("✅ Test route working");
});

// ----------------------
// 404 Handler
// ----------------------
app.use((req, res) => {
  console.log("❌ 404 HIT:", req.method, req.url);
  res.status(404).json({ message: "Route not found" });
});

// ----------------------
// Error Handler
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
  console.log(`🚀 HMS SERVER V2.0 READY on http://localhost:${PORT}`);
});