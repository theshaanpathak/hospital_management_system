import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ logout }) {
  const role = localStorage.getItem('role');
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">

      <h4 className="sidebar-title">Hospital</h4>

      <ul className="sidebar-menu">

        {/* PATIENT */}
        {role === 'patient' && (
          <li className={isActive('/dashboard') ? 'active' : ''}>
            <Link to="/dashboard">🏠 Dashboard</Link>
          </li>
        )}

        {/* DOCTOR */}
        {role === 'doctor' && (
          <>
            <li className={isActive('/doctor-dashboard') ? 'active' : ''}>
              <Link to="/doctor-dashboard">🏥 Appointments</Link>
            </li>

            <li className={isActive('/doctor-slots') ? 'active' : ''}>
              <Link to="/doctor-slots">⏰ Manage Slots</Link>
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

      <button className="logout-btn" onClick={logout}>
        Logout
      </button>

    </div>
  );
}

export default Sidebar;