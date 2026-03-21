import { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function Dashboard() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [booking, setBooking] = useState(false);

  const navigate = useNavigate();

  // ----------------------
  // Check Auth + Load Data
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
  // Load Appointments (ONLY CURRENT USER)
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
  // Book Appointment (FIXED)
  // ----------------------
  const handleBooking = async (e) => {
    e.preventDefault();

    if (!doctorId || !date) {
      alert('Please select doctor and date');
      return;
    }

    setBooking(true);

    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      // ✅ Get correct patient_id
      const patientRes = await API.get(`/patient/me?user_id=${userId}`);
      const patientId = patientRes.data.patient_id;

      // ✅ FIXED DATE FORMAT (MySQL compatible)
      const formattedDate = new Date(date)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      // ✅ Correct API call
      await API.post('/appointments', {
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        date: formattedDate
      });

      alert('Appointment booked successfully');

      setDoctorId('');
      setDate('');

      loadAppointments();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Booking failed');
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <Sidebar logout={logout} />

      {/* Main Content */}
      <div style={{ flex: 1, padding: '25px', background: '#f1f5f9' }}>

        <h2 className="mb-4">Patient Dashboard</h2>

        {/* BOOK APPOINTMENT */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-warning fw-bold">
            Book Appointment
          </div>

          <div className="card-body">
            <form onSubmit={handleBooking}>

              <select
                className="form-control mb-3"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">Select Doctor</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization})
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                className="form-control mb-3"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <button
                className="btn btn-primary w-100"
                disabled={booking}
              >
                {booking ? 'Booking...' : 'Book Appointment'}
              </button>

            </form>
          </div>
        </div>

        {/* DOCTORS */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-primary text-white fw-bold">
            Doctors
          </div>

          <div className="card-body">
            {loadingDoctors ? (
              <p>Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p>No doctors available</p>
            ) : (
              <div className="row">
                {doctors.map(doc => (
                  <div className="col-md-4 mb-3" key={doc.id}>
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <h5>{doc.name}</h5>
                        <p className="text-muted">{doc.specialization}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default Dashboard;