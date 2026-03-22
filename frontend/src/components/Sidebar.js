
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ logout }) {
  const role = localStorage.getItem('role');
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <div className="sidebar">

      <h4 className="sidebar-title">Hospital</h4>

      <ul className="sidebar-menu">

        {/* PATIENT */}
        {role === 'patient' && (
          <>
            <li className={isActive('/dashboard') ? 'active' : ''}>
              <Link to="/dashboard">🏠 Dashboard</Link>
            </li>

            {/* ✅ ADDED: Patient Sessions */}
            <li className={isActive('/patient-sessions') ? 'active' : ''}>
              <Link to="/patient-sessions">📋 Sessions</Link>
            </li>

            <li className={isActive('/doctors-list') ? 'active' : ''}>
              <Link to="/doctors-list">👨‍⚕️ Doctors</Link>
            </li>
          </>
        )}

        {/* DOCTOR */}
        {role === 'doctor' && (
          <>
            {/* ✅ FIXED: dashboard (approve/reject) */}
            <li className={isActive('/doctor-dashboard') ? 'active' : ''}>
              <Link to="/doctor-dashboard">🏥 Appointments</Link>
            </li>

            {/* ✅ NEW: sessions page */}
            <li className={isActive('/doctor/sessions') ? 'active' : ''}>
              <Link to="/doctor/sessions">📋 Sessions</Link>
            </li>

            {/* existing */}
            <li className={isActive('/doctor-slots') ? 'active' : ''}>
              <Link to="/doctor-slots">⏰ Manage Slots</Link>
            </li>
            <li className={isActive('/doctor/profile') ? 'active' : ''}>
              <Link to="/doctor/profile">👤 Profile</Link>
            </li>
          </>
        )}

        {/* ADMIN */}
        {role === 'admin' && (
          <li className={isActive('/admin') ? 'active' : ''}>
            <Link to="/admin">⚙️ Admin Panel</Link>
          </li>
        )}

      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>

    </div>
  );
}

export default Sidebar;

