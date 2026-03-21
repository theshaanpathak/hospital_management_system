import { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]); // ✅ NEW

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false); // ✅ NEW
  const [updatingId, setUpdatingId] = useState(null);

  const navigate = useNavigate();

  // ----------------------
  // AUTH CHECK
  // ----------------------
  useEffect(() => {
    const token = localStorage.getItem('token');

    console.log("🔥 Token:", token);

    if (!token) {
      navigate('/');
      return;
    }

    loadAll(); // ✅ load both

  }, [navigate]);

  // ----------------------
  // GET DOCTOR ID
  // ----------------------
  const getDoctorId = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const docRes = await API.get(`/doctors/user/${userId}`);
      return docRes.data.doctor_id;

    } catch (err) {
      console.error("❌ getDoctorId error:", err);
      throw err;
    }
  };

  // ----------------------
  // LOAD BOTH DATA
  // ----------------------
  const loadAll = async () => {
    setLoading(true);
    setLoadingSlots(true);

    try {
      const doctorId = await getDoctorId();

      const [appRes, slotRes] = await Promise.all([
        API.get(`/appointments/doctor/${doctorId}`),
        API.get(`/slots/${doctorId}`)
      ]);

      setAppointments(appRes.data || []);
      setSlots(slotRes.data || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    }

    setLoading(false);
    setLoadingSlots(false);
  };

  // ----------------------
  // UPDATE STATUS
  // ----------------------
  const updateStatus = async (id, status) => {
    setUpdatingId(id);

    try {
      await API.put(`/appointments/${id}/status`, { status });

      setAppointments(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status } : app
        )
      );

    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }

    setUpdatingId(null);
  };

  // ----------------------
  // BADGE STYLE
  // ----------------------
  const getBadge = (status) => {
    if (status === 'approved') return 'bg-success';
    if (status === 'rejected') return 'bg-danger';
    return 'bg-warning text-dark';
  };

  // ----------------------
  // LOGOUT
  // ----------------------
  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <Sidebar logout={logout} />

      <div style={{ flex: 1, padding: '25px', background: '#f1f5f9' }}>

        <h2 className="mb-4">Doctor Dashboard</h2>

        {/* ---------------------- */}
        {/* APPOINTMENTS */}
        {/* ---------------------- */}
        <div className="card shadow-sm mb-4">
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
                <thead className="table-dark">
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id}>
                      <td>{app.patient_name}</td>
                      <td>{new Date(app.date).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        {app.status === 'pending' ? (
                          <>
                            <button
                              className="btn btn-success btn-sm me-2"
                              disabled={updatingId === app.id}
                              onClick={() => updateStatus(app.id, 'approved')}
                            >
                              ✔ Approve
                            </button>

                            <button
                              className="btn btn-danger btn-sm"
                              disabled={updatingId === app.id}
                              onClick={() => updateStatus(app.id, 'rejected')}
                            >
                              ✖ Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-muted">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>

        {/* ---------------------- */}
        {/* SLOTS LIST (NEW) */}
        {/* ---------------------- */}
        <div className="card shadow-sm">
          <div className="card-header bg-dark text-white fw-bold">
            My Slots
          </div>

          <div className="card-body">

            {loadingSlots ? (
              <p>Loading slots...</p>
            ) : slots.length === 0 ? (
              <p>No slots available</p>
            ) : (
              <ul className="list-group">
                {slots.map(slot => (
                  <li key={slot.id} className="list-group-item">
                    {new Date(slot.slot_time).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}


export default DoctorDashboard;