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

        {/* Patient */}
        {role === 'patient' && (
          <li className={isActive('/dashboard') ? 'active' : ''}>
            <Link to="/dashboard">🏠 Dashboard</Link>
          </li>
        )}

        {/* Doctor */}
        {role === 'doctor' && (
          <li className={isActive('/doctor') ? 'active' : ''}>
            <Link to="/doctor">👨‍⚕️ Doctor Panel</Link>
          </li>
        )}

        {/* Admin */}
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