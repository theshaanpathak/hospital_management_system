
import { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

function DoctorSessions() {
  const [approvedAppointments, setApprovedAppointments] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [file, setFile] = useState(null);
  const [details, setDetails] = useState(null);

  const navigate = useNavigate();

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <Sidebar logout={() => {
        localStorage.clear();
        navigate('/');
      }} />

      <div style={{ flex: 1, padding: '25px', background: '#f1f5f9' }}>
        <h2>Sessions</h2>

        <div className="row mt-4">

          {/* LEFT LIST */}
          <div className="col-md-4">
            <ul className="list-group">
              {approvedAppointments.map(app => (
                <li
                  key={app.id}
                  className={`list-group-item ${
                    selectedSession?.id === app.id ? 'active' : ''
                  }`}
                  style={{
                    cursor: 'pointer',
                    transition: '0.2s',
                    color: selectedSession?.id === app.id ? 'white' : 'black'
                  }}
                  onClick={() => {
                    setSelectedSession(app);
                    loadDetails(app.id);
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSession?.id !== app.id) {
                      e.currentTarget.style.background = '#e9f2ff';
                      e.currentTarget.style.color = '#0d6efd'; // ✅ blue text
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSession?.id !== app.id) {
                      e.currentTarget.style.background = '';
                      e.currentTarget.style.color = 'black';
                    }
                  }}
                >
                  <strong>{app.patient_name}</strong>
                  <br />
                  <small>
                    {new Date(app.date).toLocaleString()}
                  </small>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT PANEL */}
          <div className="col-md-8">
            {selectedSession ? (
              <>
                <h5>Session Details</h5>

                {/* SESSION INFO */}
                <div className="mb-3 p-3 bg-white rounded shadow-sm">
                  <p><strong>Patient:</strong> {selectedSession.patient_name}</p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedSession.date).toLocaleString()}
                  </p>
                  <p><strong>Status:</strong> Approved</p>
                </div>

                <textarea
                  className="form-control mb-2"
                  placeholder="Enter notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <textarea
                  className="form-control mb-2"
                  placeholder="Enter prescription..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                />

                <input
                  type="file"
                  className="form-control mb-2"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                {details && details.attachment && (
                  <div className="mb-2">
                    <a
                      href={`http://localhost:5000/uploads/${details.attachment}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-secondary btn-sm"
                    >
                      📎 View Attachment
                    </a>
                  </div>
                )}

                <button className="btn btn-primary" onClick={saveSession}>
                  Save
                </button>
              </>
            ) : (
              <p>Select an appointment</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default DoctorSessions;

