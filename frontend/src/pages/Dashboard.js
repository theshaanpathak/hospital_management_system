
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

  const [filter, setFilter] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    loadDoctors();
    loadAppointments();
  }, [navigate]);

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await API.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error("❌ Doctors Error:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // ✅ FIXED + DEBUG
  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);

      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      console.log("👤 User ID:", userId);

      const patientRes = await API.get(`/patient/me?user_id=${userId}`);

      console.log("🧾 Patient Response:", patientRes.data);

      const patientId = patientRes.data?.patient_id;

      if (!patientId) {
        console.error("❌ patient_id not found");
        setAppointments([]);
        return;
      }

      console.log("🆔 Patient ID:", patientId);

      const res = await API.get(`/appointments/patient/${patientId}`);

      console.log("📅 Appointments:", res.data);

      setAppointments(res.data || []);

    } catch (err) {
      console.error("❌ Appointment Load Error:", err);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadSlots = async (doctorId) => {
    try {
      setLoadingSlots(true);
      const res = await API.get(`/slots/${doctorId}`);
      setSlots(res.data || []);
    } catch (err) {
      console.error("❌ Slot Error:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDoctorChange = (id) => {
    setDoctorId(id);
    setSlotId('');
    setSlots([]);

    if (id) {
      loadSlots(id);
    }
  };

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

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getBadge = (status) => {
    if (status === 'approved') return 'bg-success';
    if (status === 'rejected') return 'bg-danger';
    return 'bg-warning text-dark';
  };

  const filteredAppointments =
    filter === 'all'
      ? appointments
      : appointments.filter(app => app.status === filter);

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

              <button className="btn btn-primary w-100" disabled={booking}>
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

            <div className="mb-3">
              {['all', 'pending', 'approved', 'rejected'].map(type => (
                <button
                  key={type}
                  className={`btn btn-sm me-2 ${
                    filter === type ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  onClick={() => setFilter(type)}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>

            {loadingAppointments ? (
              <p>Loading appointments...</p>
            ) : filteredAppointments.length === 0 ? (
              <p>❌ No appointments found (Check console)</p>
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
                  {filteredAppointments.map(app => (
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

