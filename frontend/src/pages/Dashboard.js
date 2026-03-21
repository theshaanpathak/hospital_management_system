import { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function Dashboard() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [doctorId, setDoctorId] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState('');

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const navigate = useNavigate();

  // ----------------------
  // Auth + Initial Load
  // ----------------------
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    loadDoctors();
    loadAppointments();
  }, [navigate]);

  // ----------------------
  // Load Doctors
  // ----------------------
  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await API.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // ----------------------
  // Load Appointments
  // ----------------------
  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);

      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const patientRes = await API.get(`/patient/me?user_id=${userId}`);
      const patientId = patientRes.data.patient_id;

      const res = await API.get(`/appointments/patient/${patientId}`);
      setAppointments(res.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // ----------------------
  // Load Slots (FIXED + DEBUG)
  // ----------------------
  const loadSlots = async (doctorId) => {
    try {
      setLoadingSlots(true);

      console.log("🔥 Loading slots for doctor:", doctorId);

      const res = await API.get(`/slots/${doctorId}`);

      console.log("🔥 Slots response:", res.data);

      setSlots(res.data || []);

    } catch (err) {
      console.error("❌ Slot Load Error:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ----------------------
  // Handle Doctor Change (IMPORTANT FIX)
  // ----------------------
  const handleDoctorChange = (id) => {
    setDoctorId(id);
    setSlotId('');
    setSlots([]); // reset previous slots

    if (id) {
      loadSlots(id); // ✅ ensures slots load properly
    }
  };

  // ----------------------
  // Book Appointment
  // ----------------------
  const handleBooking = async (e) => {
    e.preventDefault();

    if (!doctorId || !slotId) {
      alert('Please select doctor and slot');
      return;
    }

    setBooking(true);

    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const patientRes = await API.get(`/patient/me?user_id=${userId}`);
      const patientId = patientRes.data.patient_id;

      await API.post('/appointments', {
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        slot_id: Number(slotId)
      });

      alert('Appointment booked successfully');

      // reset
      setDoctorId('');
      setSlotId('');
      setSlots([]);

      loadAppointments();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  // ----------------------
  // Logout
  // ----------------------
  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  // ----------------------
  // Badge Styling
  // ----------------------
  const getBadge = (status) => {
    if (status === 'approved') return 'bg-success';
    if (status === 'rejected') return 'bg-danger';
    return 'bg-warning text-dark';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <Sidebar logout={logout} />

      <div style={{ flex: 1, padding: '25px', background: '#f1f5f9' }}>

        <h2 className="mb-4">Patient Dashboard</h2>

        {/* BOOK APPOINTMENT */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-warning fw-bold">
            Book Appointment
          </div>

          <div className="card-body">
            <form onSubmit={handleBooking}>

              {/* DOCTOR */}
              <select
                className="form-control mb-3"
                value={doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
              >
                <option value="">Select Doctor</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization})
                  </option>
                ))}
              </select>

              {/* SLOT */}
              {doctorId && (
                <select
                  className="form-control mb-3"
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                >
                  <option value="">Select Slot</option>

                  {loadingSlots ? (
                    <option>Loading slots...</option>
                  ) : slots.length === 0 ? (
                    <option>No slots available</option>
                  ) : (
                    slots.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {new Date(slot.slot_time).toLocaleString()}
                      </option>
                    ))
                  )}
                </select>
              )}

              <button
                className="btn btn-primary w-100"
                disabled={booking}
              >
                {booking ? 'Booking...' : 'Book Appointment'}
              </button>

            </form>
          </div>
        </div>

        {/* APPOINTMENTS */}
        <div className="card shadow-sm">
          <div className="card-header bg-success text-white fw-bold">
            My Appointments
          </div>

          <div className="card-body">
            {loadingAppointments ? (
              <p>Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p>No appointments found</p>
            ) : (
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id}>
                      <td>{app.doctor_name}</td>
                      <td>{new Date(app.date).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getBadge(app.status)}`}>
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

export default Dashboard;