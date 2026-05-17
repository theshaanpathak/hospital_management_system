
import { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

function DoctorProfile() {
  const [doctor, setDoctor] = useState(null);

  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [bio, setBio] = useState('');

  const [editMode, setEditMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const res = await API.get(`/doctors/user/${userId}`);
      const doctorId = res.data.doctor_id;

      const allDoctors = await API.get('/doctors');

      const current = allDoctors.data.find(d => Number(d.id) === Number(doctorId));

      if (!current) {
        console.error("Doctor not found");
        return;
      }

      // ✅ FIX: ensure id is always present
      const fixedDoctor = {
        ...current,
        id: current.id
      };

      setDoctor(fixedDoctor);

      setName(fixedDoctor.name || '');
      setSpecialization(fixedDoctor.specialization || '');
      setPhone(fixedDoctor.phone || '');
      setExperience(fixedDoctor.experience || '');
      setQualification(fixedDoctor.qualification || '');
      setBio(fixedDoctor.bio || '');

    } catch (err) {
      console.error(err);
    }
  };

  const updateProfile = async () => {
    try {
      console.log("Updating ID:", doctor.id); // ✅ debug

      await API.put(`/doctors/${doctor.id}`, {
        name,
        specialization,
        phone,
        experience,
        qualification,
        bio
      });

      alert("Profile updated successfully ✅");

      setEditMode(false);
      loadProfile();

    } catch (err) {
      console.error(err);
      alert("Update failed ❌");
    }
  };

  return (
    <>
      <h2 style={{ fontWeight: '700' }} className="mb-4">👨‍⚕️ My Profile</h2>

      {!doctor ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            {/* VIEW MODE */}
            {!editMode && (
              <div className="card shadow-sm border-0" style={{ borderRadius: '20px' }}>
                <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center" style={{ borderRadius: '20px 20px 0 0' }}>
                  <h5 className="mb-0 fw-bold">Profile Details</h5>
                  <button
                    className="btn btn-primary btn-sm px-3"
                    style={{ borderRadius: '8px' }}
                    onClick={() => setEditMode(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                </div>

                <div className="card-body p-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Full Name</label>
                      <p className="fw-semibold text-dark fs-5">{doctor.name}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Specialization</label>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2" style={{ borderRadius: '8px' }}>{doctor.specialization}</span>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Contact Phone</label>
                      <p className="fw-semibold text-dark">{doctor.phone || "Not added"}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Total Experience</label>
                      <p className="fw-semibold text-dark">{doctor.experience ? `${doctor.experience} Years` : "Not added"}</p>
                    </div>
                    <div className="col-md-12">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Academic Qualification</label>
                      <p className="fw-semibold text-dark">{doctor.qualification || "Not added"}</p>
                    </div>
                    <div className="col-md-12">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Professional Bio</label>
                      <div className="p-3 bg-light rounded-3 border">
                        {doctor.bio || "No professional biography added yet."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT MODE */}
            {editMode && (
              <div className="card shadow-sm border-0" style={{ borderRadius: '20px' }}>
                <div className="card-header bg-white py-3 border-0" style={{ borderRadius: '20px 20px 0 0' }}>
                  <h5 className="mb-0 fw-bold">Update Information</h5>
                </div>

                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Full Name</label>
                      <input className="form-control" style={{ borderRadius: '10px' }} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Specialization</label>
                      <input className="form-control" style={{ borderRadius: '10px' }} value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Phone</label>
                      <input className="form-control" style={{ borderRadius: '10px' }} value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Experience (years)</label>
                      <input type="number" className="form-control" style={{ borderRadius: '10px' }} value={experience} onChange={(e) => setExperience(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Qualification</label>
                      <input className="form-control" style={{ borderRadius: '10px' }} value={qualification} onChange={(e) => setQualification(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Professional Bio</label>
                      <textarea className="form-control" rows="4" style={{ borderRadius: '10px' }} value={bio} onChange={(e) => setBio(e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-4 d-flex gap-2">
                    <button className="btn btn-success px-4 fw-bold" style={{ borderRadius: '10px' }} onClick={updateProfile}>💾 Save Changes</button>
                    <button className="btn btn-light px-4" style={{ borderRadius: '10px' }} onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 text-center p-4" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
              <div className="mx-auto mb-3" style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                👨‍⚕️
              </div>
              <h4 className="fw-bold mb-1">{doctor.name}</h4>
              <p className="opacity-75 small mb-0">{doctor.specialization}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DoctorProfile;

