import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ----------------------
// AUTH
// ----------------------
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';

// ----------------------
// PATIENT
// ----------------------
import Dashboard from './pages/Dashboard';
import PatientSessions from './pages/PatientSessions';
import DoctorsList from './pages/DoctorsList';
import PatientBills from './pages/PatientBills';

// ----------------------
// DOCTOR
// ----------------------
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorSlots from './pages/DoctorSlots';
import DoctorSessions from './pages/DoctorSessions';
import DoctorProfile from './pages/DoctorProfile';
import DoctorBilling from './pages/DoctorBilling';

// ----------------------
// ADMIN
// ----------------------
import AdminDashboard from './pages/AdminDashboard';
import AdminBilling from './pages/AdminBilling';


import DashboardLayout from './components/DashboardLayout';

// ----------------------
// 🔐 PROTECTED ROUTE
// ----------------------
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('admin') === 'true';

  if (!token && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}


// ----------------------
// APP ROUTES
// ----------------------
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* PATIENT */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/patient-sessions" element={<ProtectedRoute><PatientSessions /></ProtectedRoute>} />
        <Route path="/doctors-list" element={<ProtectedRoute><DoctorsList /></ProtectedRoute>} />
        <Route path="/patient-bills" element={<ProtectedRoute><PatientBills /></ProtectedRoute>} />

        {/* DOCTOR */}
        <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/sessions" element={<ProtectedRoute><DoctorSessions /></ProtectedRoute>} />
        <Route path="/doctor-slots" element={<ProtectedRoute><DoctorSlots /></ProtectedRoute>} />
        <Route path="/doctor/profile" element={<ProtectedRoute><DoctorProfile /></ProtectedRoute>} />
        <Route path="/doctor/billing" element={<ProtectedRoute><DoctorBilling /></ProtectedRoute>} />

        {/* ADMIN */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/billing" element={<ProtectedRoute><AdminBilling /></ProtectedRoute>} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;