
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorSlots from './pages/DoctorSlots';
import DoctorSessions from './pages/DoctorSessions';
import PatientSessions from './pages/PatientSessions';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import DoctorProfile from './pages/DoctorProfile';
import DoctorsList from './pages/DoctorsList'; // ✅ ADDED

// 🔐 Protected Route
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('admin') === 'true';

  if (!token && !isAdmin) {
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
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* PATIENT */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient-sessions"
          element={
            <ProtectedRoute>
              <PatientSessions />
            </ProtectedRoute>
          }
        />

        {/* ✅ ADDED: DOCTORS LIST */}
        <Route
          path="/doctors-list"
          element={
            <ProtectedRoute>
              <DoctorsList />
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

        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute>
              <DoctorProfile />
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

