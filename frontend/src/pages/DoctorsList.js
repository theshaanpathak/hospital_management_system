
import { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await API.get('/doctors');
      setDoctors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <h2 className="mb-4">👨‍⚕️ Available Doctors</h2>

      {doctors.length === 0 ? (
        <div className="text-center py-5 border rounded-4 bg-white shadow-sm">
          <p className="text-muted mb-0">No doctors are currently available in the system.</p>
        </div>
      ) : (
        <div className="row g-4 mt-2">
          {doctors.map(doc => (
            <div key={doc.id} className="col-md-6 col-xl-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px', transition: 'transform 0.2s' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="avatar-circle" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'white' }}>
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">{doc.name}</h5>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" style={{ fontSize: '0.75rem', borderRadius: '6px' }}>{doc.specialization}</span>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2 mb-4">
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted fw-semibold">Experience</span>
                      <span className="text-dark fw-bold">{doc.experience || "N/A"} Years</span>
                    </div>
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted fw-semibold">Qualification</span>
                      <span className="text-dark fw-bold">{doc.qualification || "N/A"}</span>
                    </div>
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted fw-semibold">Contact</span>
                      <span className="text-dark fw-bold">{doc.phone || "N/A"}</span>
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <label className="text-muted small fw-bold text-uppercase d-block mb-1">About Doctor</label>
                    <p className="small text-muted mb-0" style={{ display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {doc.bio || "No biography provided."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default DoctorsList;

