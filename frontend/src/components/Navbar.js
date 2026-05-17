import { Link } from 'react-router-dom';

function Sidebar({ logout }) {
  return (
    <div className="bg-dark text-white vh-100 p-3" style={{ width: '220px' }}>
      <h4 className="mb-4">Hospital</h4>

      <ul className="nav flex-column">

        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/dashboard">
            Dashboard
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/appointments">
            Appointments
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/doctors">
            Doctors
          </Link>
        </li>

        <li className="nav-item mt-4">
          <button className="btn btn-danger w-100" onClick={logout}>
            Logout
          </button>
        </li>

      </ul>
    </div>
  );
}

export default Sidebar;