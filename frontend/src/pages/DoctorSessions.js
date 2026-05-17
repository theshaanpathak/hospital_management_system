import { useEffect, useState } from 'react';
import { 
  Calendar, 
  ClipboardList, 
  FileText, 
  Save, 
  Search, 
  User, 
  Stethoscope,
  Paperclip
} from 'lucide-react';
import AppIcon from '../components/AppIcon';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

function DoctorSessions() {
  const [approvedAppointments, setApprovedAppointments] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [file, setFile] = useState(null);
  const [details, setDetails] = useState(null);

  // Month Filtering State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const navigate = useNavigate();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    loadData();
  }, []);

  const getDoctorId = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const res = await API.get(`/doctors/user/${userId}`);
      return res.data.doctor_id;
    } catch (err) {
      navigate('/');
    }
  };

  const loadData = async () => {
    try {
      const doctorId = await getDoctorId();
      if (!doctorId) return;

      const res = await API.get(`/doctors/${doctorId}/approved-appointments`);
      setApprovedAppointments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDetails = async (id) => {
    try {
      const res = await API.get(`/appointments/details/${id}`);
      setDetails(res.data);

      if (res.data) {
        setNotes(res.data.notes || "");
        setPrescription(res.data.prescription || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveSession = async () => {
    try {
      const formData = new FormData();
      formData.append("notes", notes);
      formData.append("prescription", prescription);
      if (file) formData.append("file", file);

      await API.post(
        `/appointments/details/${selectedSession.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      alert("Saved!");
      loadDetails(selectedSession.id);

    } catch (err) {
      console.error(err);
      alert("Failed");
    }
  };

  // Logic: Categorize and Filter
  const filteredAppointments = approvedAppointments.filter(app => {
    const d = new Date(app.date);
    return d.getMonth() === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📋 Consultation Sessions</h2>
        
        <div className="d-flex gap-2 align-items-center bg-white p-2 shadow-sm rounded-3">
          <span className="text-muted small fw-bold ms-2">FILTER:</span>
          <select 
            className="form-select form-select-sm border-0 fw-bold" 
            style={{ width: '130px', background: 'transparent' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select 
            className="form-select form-select-sm border-0 fw-bold border-start" 
            style={{ width: '90px', background: 'transparent' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT LIST */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center" style={{ borderRadius: '16px 16px 0 0' }}>
              <h6 className="mb-0 fw-bold">{months[selectedMonth]} {selectedYear}</h6>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3">{filteredAppointments.length} Sessions</span>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {filteredAppointments.length === 0 ? (
                  <div className="p-5 text-center">
                    <div className="fs-1 opacity-25">📁</div>
                    <div className="text-muted small mt-2">No records found for this month.</div>
                  </div>
                ) : (
                  filteredAppointments.map(app => (
                    <button
                      key={app.id}
                      className={`list-group-item list-group-item-action border-0 py-3 px-4 ${
                        selectedSession?.id === app.id ? 'bg-primary-subtle border-start border-primary border-4' : ''
                      }`}
                      style={{ transition: 'all 0.2s' }}
                      onClick={() => {
                        setSelectedSession(app);
                        loadDetails(app.id);
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-bold text-dark">{app.patient_name}</div>
                        <span className="badge bg-light text-muted border-0 fw-bold" style={{ fontSize: '10px' }}>#AID-{app.id}</span>
                      </div>
                      <div className="text-muted small mt-1 d-flex align-items-center gap-1">
                        <AppIcon icon={Calendar} size={12} /> {new Date(app.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-md-8">
          {selectedSession ? (
            <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 py-3" style={{ borderRadius: '16px 16px 0 0' }}>
                <h5 className="mb-0 fw-bold">Session Record</h5>
              </div>

              <div className="card-body p-4">
                {/* SESSION INFO */}
                <div className="mb-4 p-3 rounded-3 border bg-light">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Patient Name</label>
                      <div className="fw-bold">{selectedSession.patient_name}</div>
                    </div>
                    <div className="col-sm-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Appointment Time</label>
                      <div className="fw-bold">{new Date(selectedSession.date).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Clinical Notes</label>
                  <textarea
                    className="form-control"
                    style={{ borderRadius: '10px' }}
                    rows="3"
                    placeholder="Document symptoms, diagnosis, and observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Prescription</label>
                  <textarea
                    className="form-control"
                    style={{ borderRadius: '10px', color: '#0d6efd', fontWeight: '500' }}
                    rows="3"
                    placeholder="Enter medications, dosage, and instructions..."
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold">Upload Reports / Scans</label>
                  <div className="d-flex gap-3 align-items-center">
                    <input
                      type="file"
                      className="form-control"
                      style={{ borderRadius: '10px' }}
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    {details && details.attachment && (
                      <a
                        href={`http://localhost:5000/uploads/${details.attachment}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-secondary btn-sm flex-shrink-0 px-3"
                        style={{ borderRadius: '8px' }}
                      >
                        📎 View Current
                      </a>
                    )}
                  </div>
                </div>

                <button className="btn btn-primary w-100 py-3 fw-bold shadow-sm" style={{ borderRadius: '12px' }} onClick={saveSession}>
                  💾 Save Consultation Records
                </button>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm border-0 text-center py-5 h-100 d-flex flex-column justify-content-center" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.5)', border: '2px dashed #e2e8f0' }}>
              <div style={{ fontSize: '3rem' }}>🩺</div>
              <h5 className="mt-3 text-muted">Select an appointment to start session</h5>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DoctorSessions;

