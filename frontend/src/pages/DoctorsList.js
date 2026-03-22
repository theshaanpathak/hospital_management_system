
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <Sidebar logout={() => {
        localStorage.clear();
        navigate('/');
      }} />

      <div style={{ flex: 1, padding: '25px', background: '#f1f5f9' }}>
        <h2>👨‍⚕️ Doctors</h2>

        {doctors.length === 0 ? (
          <p>No doctors available</p>
        ) : (
          <div className="row mt-4">

            {doctors.map(doc => (
              <div key={doc.id} className="col-md-6 mb-4">

                <div className="card shadow-sm p-3 h-100">

                  <h5>{doc.name}</h5>
                  <p><strong>Specialization:</strong> {doc.specialization}</p>
                  <p><strong>Experience:</strong> {doc.experience || "Not added"} years</p>
                  <p><strong>Qualification:</strong> {doc.qualification || "Not added"}</p>
                  <p><strong>Phone:</strong> {doc.phone || "Not added"}</p>
                  <p><strong>Bio:</strong> {doc.bio || "Not added"}</p>

                </div>

              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorsList;

