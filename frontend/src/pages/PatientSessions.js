
import { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

function PatientSessions() {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      // get patient id
      const patientRes = await API.get(`/patient/me?user_id=${userId}`);
      const patientId = patientRes.data.patient_id;

      // get appointments
      const res = await API.get(`/appointments/patient/${patientId}`);

      // filter only approved
      const approved = res.data.filter(a => a.status === 'approved');

      // fetch details for each
      const finalData = await Promise.all(
        approved.map(async (app) => {
          const detailRes = await API.get(`/appointments/details/${app.id}`);
          return {
            ...app,
            details: detailRes.data
          };
        })
      );

      setSessions(finalData);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <Sidebar logout={() => {
        localStorage.clear();
        navigate('/');
      }} />

      <div style={{ flex: 1, padding: '25px', background: '#f1f5f9' }}>
        <h2>My Sessions</h2>

        {sessions.length === 0 ? (
          <p>No session data available</p>
        ) : (
          <div className="row mt-3">
            {sessions.map(session => (
              <div key={session.id} className="col-md-6 mb-3">

                <div className="card shadow-sm">
                  <div className="card-body">

                    <h5>{session.doctor_name}</h5>

                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(session.date).toLocaleString()}
                    </p>

                    <p>
                      <strong>Notes:</strong>{" "}
                      {session.details?.notes || "No notes"}
                    </p>

                    <p>
                      <strong>Prescription:</strong>{" "}
                      {session.details?.prescription || "No prescription"}
                    </p>

                    {/* Attachment */}
                    {session.details?.attachment && (
                      <a
                        href={`http://localhost:5000/uploads/${session.details.attachment}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        📎 Download Attachment
                      </a>
                    )}

                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientSessions;

