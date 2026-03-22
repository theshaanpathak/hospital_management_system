
import { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <Sidebar logout={() => {
        localStorage.clear();
        navigate('/');
      }} />

      <div style={{ flex: 1, padding: '30px', background: '#f1f5f9' }}>
        <h2 style={{ fontWeight: '600' }}>👨‍⚕️ Doctor Profile</h2>

        {!doctor ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* VIEW MODE */}
            {!editMode && (
              <div className="card shadow-sm p-4 mt-4">

                <h5 className="mb-3">Basic Information</h5>

                <p><strong>Name:</strong> {doctor.name}</p>
                <p><strong>Specialization:</strong> {doctor.specialization}</p>
                <p><strong>Phone:</strong> {doctor.phone || "Not added"}</p>

                <hr />

                <h5 className="mb-3">Professional Details</h5>

                <p>
                  <strong>Experience:</strong>{" "}
                  {doctor.experience ? `${doctor.experience} years` : "Not added"}
                </p>

                <p><strong>Qualification:</strong> {doctor.qualification || "Not added"}</p>
                <p><strong>Bio:</strong> {doctor.bio || "Not added"}</p>

                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setEditMode(true)}
                >
                  ✏️ Edit Profile
                </button>

              </div>
            )}

            {/* EDIT MODE */}
            {editMode && (
              <div className="card shadow-sm p-4 mt-4">

                <h5 className="mb-3">Edit Profile</h5>

                <label>Name</label>
                <input
                  className="form-control mb-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <label>Specialization</label>
                <input
                  className="form-control mb-3"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />

                <label>Phone</label>
                <input
                  className="form-control mb-3"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <label>Experience (years)</label>
                <input
                  type="number"
                  className="form-control mb-3"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />

                <label>Qualification</label>
                <input
                  className="form-control mb-3"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                />

                <label>Bio</label>
                <textarea
                  className="form-control mb-3"
                  rows="3"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />

                <button className="btn btn-success me-2" onClick={updateProfile}>
                  💾 Save
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorProfile;

