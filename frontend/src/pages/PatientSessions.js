import { useEffect, useState } from 'react';
import { 
  Calendar, 
  ClipboardList, 
  FileText, 
  User, 
  Stethoscope, 
  Download, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import AppIcon from '../components/AppIcon';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

function PatientSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    loadSessions();
  }, [navigate]);

  const loadSessions = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/');
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const patientRes = await API.get(`/patients/user/${userId}`);
      const patientId = patientRes?.data?.patient_id;

      if (!patientId) {
        console.warn("Patient ID not found");
        setSessions([]);
        return;
      }

      const res = await API.get(`/appointments/patient/${patientId}`);
      const appointments = res?.data || [];

      // only approved sessions
      const approved = appointments.filter(a => a.status === 'approved');

      if (approved.length === 0) {
        setSessions([]);
        return;
      }

      const finalData = await Promise.all(
        approved.map(async (app) => {
          try {
            const detailRes = await API.get(`/appointments/details/${app.id}`);

            return {
              ...app,
              details: detailRes?.data || null
            };
          } catch (err) {
            return {
              ...app,
              details: null
            };
          }
        })
      );

      setSessions(finalData);

    } catch (err) {
      console.error("❌ Session Load Error:", err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="fw-bold text-dark">My Consultation History</h2>
        <p className="text-muted">Review your past sessions, clinical notes, and prescriptions.</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Retrieving medical history...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-5 border rounded-4 bg-white shadow-sm border-dashed">
          <AppIcon icon={ClipboardList} size={48} className="opacity-25 mb-3" />
          <h5 className="fw-bold text-dark">No medical sessions yet</h5>
          <p className="text-muted">Once your doctor approves and completes a consultation, it will appear here.</p>
        </div>
      ) : (
        <div className="row g-4">
          {sessions.map(session => (
            <div key={session.id} className="col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 h-100 transition-all hover-shadow" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div className="card-header bg-primary text-white py-3 border-0 px-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <AppIcon icon={Stethoscope} size={18} />
                      <h6 className="mb-0 fw-bold">{session.doctor_name || "Doctor Consultation"}</h6>
                    </div>
                    <span className="badge bg-white text-primary rounded-pill fw-bold" style={{ fontSize: '10px', padding: '5px 12px' }}>
                      #AID-{session.id}
                    </span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="mb-4 d-flex align-items-center gap-2 p-2 px-3 bg-light rounded-3">
                    <AppIcon icon={Calendar} size={14} className="text-primary" />
                    <span className="fw-bold small text-dark">{new Date(session.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small fw-bold text-uppercase d-flex align-items-center gap-2 mb-2">
                      <AppIcon icon={FileText} size={12} /> Clinical Notes
                    </label>
                    <div className="p-3 bg-light rounded-3 text-dark border-0" style={{ fontSize: '0.9rem', minHeight: '60px', color: '#475569' }}>
                      {session.details?.notes || "No clinical notes provided."}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small fw-bold text-uppercase d-flex align-items-center gap-2 mb-2">
                      <AppIcon icon={ClipboardList} size={12} /> Prescription
                    </label>
                    <div className="p-3 bg-primary-subtle text-primary fw-bold rounded-3 border-0" style={{ fontSize: '0.9rem', minHeight: '60px' }}>
                      {session.details?.prescription || "No prescription issued."}
                    </div>
                  </div>

                  {session.details?.attachment && (
                    <a
                      href={`http://localhost:5000/uploads/${session.details.attachment}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-bold"
                      style={{ borderRadius: '12px' }}
                    >
                      <AppIcon icon={Download} size={16} /> 
                      <span>View Medical Reports</span>
                    </a>
                  )}
                </div>
                <div className="card-footer bg-white border-0 pb-3 px-4 text-center">
                  <span className="text-success small fw-bold d-flex align-items-center justify-content-center gap-1">
                    <AppIcon icon={CheckCircle2} size={14} /> Consultation Completed
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default PatientSessions;
