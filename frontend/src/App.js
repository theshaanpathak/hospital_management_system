
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorSlots from './pages/DoctorSlots';
import DoctorSessions from './pages/DoctorSessions';
import PatientSessions from './pages/PatientSessions'; // ✅ ADDED
import AdminDashboard from './pages/AdminDashboard';

// 🔐 Protected Route (same)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PATIENT */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ ADDED: PATIENT SESSIONS */}
        <Route
          path="/patient-sessions"
          element={
            <ProtectedRoute>
              <PatientSessions />
            </ProtectedRoute>
          }
        />

        {/* DOCTOR */}
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/sessions"
          element={
            <ProtectedRoute>
              <DoctorSessions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor-slots"
          element={
            <ProtectedRoute>
              <DoctorSlots />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

