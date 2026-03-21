import { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ----------------------
  // Auth Check + Load Data
  // ----------------------
  useEffect(() => {
    const role = localStorage.getItem('role');

    if (role !== 'doctor') {
      navigate('/');
      return;
    }

    loadAppointments();
  }, []);

  // ----------------------
  // Load Appointments
  // ----------------------
  const loadAppointments = async () => {
  setLoading(true);

  try {
    console.log("🚀 Loading appointments started");

    const token = localStorage.getItem('token');

    if (!token) {
      console.log("❌ No token");
      navigate('/');
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;

    console.log("👤 userId:", userId);

    // STEP 1: get doctor_id
    const docRes = await API.get(`/doctors/user/${userId}`);
    console.log("📥 doctor API response:", docRes);

    const doctorId = docRes?.data?.doctor_id;

    console.log("✅ doctorId:", doctorId);

    if (!doctorId) {
      throw new Error("Doctor ID not found");
    }

    // STEP 2: get appointments
    const res = await API.get(`/appointments/doctor/${doctorId}`);
    console.log("📥 appointments API response:", res);

    setAppointments(res.data || []);

  } catch (err) {
    console.error("❌ FULL ERROR:", err);

    alert(
      err.response?.data?.message ||
      err.message ||
      "Something went wrong"
    );
  }

  console.log("✅ Loading finished");
  setLoading(false);
};
  // ----------------------
  // Logout
  // ----------------------
  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <Sidebar logout={logout} />

      {/* Main Content */}
      <div style={{ flex: 1, padding: '25px', background: '#f1f5f9' }}>

        <h2 className="mb-4">Doctor Dashboard</h2>

        <div className="card shadow-sm">
          <div className="card-header bg-info text-white fw-bold">
            Patient Appointments
          </div>

          <div className="card-body">

            {loading ? (
              <p>Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p>No appointments found</p>
            ) : (
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id}>
                      <td>{app.patient_name}</td>
                      <td>{new Date(app.date).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default DoctorDashboard;