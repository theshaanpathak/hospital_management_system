import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function AdminDashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="d-flex">

      <Sidebar logout={logout} />

      <div className="flex-grow-1 p-4">
        <h2>Admin Dashboard</h2>

        <div className="card mt-3">
          <div className="card-body">
            <p>Manage system (patients, doctors, billing, etc.)</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;