import { useEffect, useState } from 'react';
import { 
  Calendar, 
  ClipboardList, 
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import AppIcon from '../components/AppIcon';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import MonthlySlotPicker from '../components/MonthlySlotPicker';

function Dashboard() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [doctorId, setDoctorId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [slots, setSlots] = useState([]);
  
  // Intake Form State
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [medications, setMedications] = useState('');
  const [file, setFile] = useState(null);

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

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);

      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const patientRes = await API.get(`/patients/me`, {
        params: { user_id: userId }
      });

      const patientId = patientRes.data?.patient_id;

      if (!patientId) {
        console.error("❌ patient_id not found");
        setAppointments([]);
        return;
      }

      const res = await API.get(`/appointments/patient/${patientId}`);
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

    if (!doctorId || !slotId || !symptoms || !duration) {
      alert('Please select doctor, slot, and describe your symptoms/duration.');
      return;
    }

    setBooking(true);

    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const patientRes = await API.get(`/patients/me`, {
        params: { user_id: userId }
      });

      const patientId = patientRes.data.patient_id;

      const formData = new FormData();
      formData.append('patient_id', Number(patientId));
      formData.append('doctor_id', Number(doctorId));
      formData.append('slot_id', Number(slotId));
      formData.append('symptoms', symptoms);
      formData.append('duration', duration);
      formData.append('medical_history', medicalHistory);
      formData.append('medications', medications);
      if (file) formData.append('file', file);

      await API.post('/appointments/book', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Appointment request submitted successfully!');

      // Reset Form
      setDoctorId('');
      setSlotId('');
      setSymptoms('');
      setDuration('');
      setMedicalHistory('');
      setMedications('');
      setFile(null);

      loadAppointments();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Booking request failed');
    } finally {
      setBooking(false);
    }
  };

  const getBadge = (status) => {
    if (status === 'approved') return 'bg-success';
    if (status === 'rejected') return 'bg-danger';
    return 'bg-warning text-dark';
  };

  const getStatusIcon = (status) => {
    if (status === 'approved') return CheckCircle2;
    if (status === 'rejected') return AlertCircle;
    return Clock;
  };

  const filteredAppointments =
    filter === 'all'
      ? appointments
      : appointments.filter(app => app.status === filter);

  return (
    <>
      <div className="mb-4">
        <h2 className="fw-bold text-dark">Patient Dashboard</h2>
        <p className="text-muted">Welcome back! Manage your healthcare journey here.</p>
      </div>

      {/* BOOK APPOINTMENT */}
      <div className="card mb-4 shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-warning fw-bold py-3 px-4 d-flex align-items-center gap-2" style={{ borderRadius: '16px 16px 0 0' }}>
          <AppIcon icon={Calendar} size={18} />
          <span>Book Appointment</span>
        </div>

        <div className="card-body p-4">
          <form onSubmit={handleBooking}>

            <div className="mb-4">
              <label className="text-muted small fw-bold text-uppercase d-block mb-2">Select Doctor</label>
              <select
                className="form-select"
                value={doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                style={{
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}
              >
                <option value="">Choose a specialist...</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>

            {doctorId && (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-8">
                    <label className="text-muted small fw-bold text-uppercase d-block mb-2">Symptoms / Problem Description</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Describe what you are experiencing..." 
                      style={{ borderRadius: '12px' }}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-bold text-uppercase d-block mb-2">Duration</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 2 days, 1 week" 
                      style={{ borderRadius: '12px', padding: '12px' }}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-bold text-uppercase d-block mb-2">Medical History (Optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="Any relevant past conditions..." 
                      style={{ borderRadius: '12px' }}
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-bold text-uppercase d-block mb-2">Current Medications (Optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="List any medications you are taking..." 
                      style={{ borderRadius: '12px' }}
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="text-muted small fw-bold text-uppercase d-block mb-2">Attach Reports / Images (Optional)</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      style={{ borderRadius: '12px' }}
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-muted small fw-bold text-uppercase d-block mb-3">Available Slots</label>
                  <MonthlySlotPicker
                    doctorId={doctorId}
                    selectedSlotId={Number(slotId)}
                    onSlotSelect={(id) => setSlotId(id)}
                  />
                </div>
              </>
            )}

            <button className="btn btn-primary w-100 mt-4 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" disabled={booking || !slotId} style={{ borderRadius: '12px' }}>
              <AppIcon icon={Calendar} size={18} />
              {booking ? 'Submitting Request...' : 'Request Appointment'}
            </button>

          </form>
        </div>
      </div>

      {/* APPOINTMENTS */}
      <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-success text-white fw-bold py-3 px-4 d-flex align-items-center gap-2" style={{ borderRadius: '16px 16px 0 0' }}>
          <AppIcon icon={ClipboardList} size={18} />
          <span>My Appointment History</span>
        </div>

        <div className="card-body p-4">

          <div className="mb-4 d-flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map(type => (
              <button
                key={type}
                className={`btn btn-sm px-3 ${filter === type ? 'btn-primary shadow-sm' : 'btn-outline-primary'
                  }`}
                style={{ borderRadius: '8px', fontWeight: '600', textTransform: 'uppercase' }}
                onClick={() => setFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {loadingAppointments ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-5 border rounded-3 bg-light border-dashed">
              <AppIcon icon={Activity} size={48} className="opacity-25 mb-3" />
              <p className="text-muted mb-0">No appointments found for the selected filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">ID</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th className="pe-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map(app => (
                    <tr key={app.id}>
                      <td className="ps-4">
                        <span className="badge bg-light text-dark border" style={{ fontSize: '10px' }}>#AID-{app.id}</span>
                      </td>
                      <td className="fw-semibold text-dark">{app.doctor_name}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <AppIcon icon={Clock} size={14} className="text-muted" />
                          <span>{new Date(app.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </td>
                      <td className="pe-4">
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${getBadge(app.status)}`} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                            <AppIcon icon={getStatusIcon(app.status)} size={12} className="me-1" />
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;