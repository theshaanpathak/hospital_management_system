
import { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("admin") !== "true") {
      navigate('/');
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      const docRes = await API.get('/doctors');
      setDoctors(docRes.data);

      const patRes = await API.get('/patient/all'); // backend route needed
      setPatients(patRes.data);

    } catch (err) {
      console.error(err);
    }
  };

  const deleteDoctor = async (id) => {
    if (!window.confirm("Delete doctor?")) return;

    await API.delete(`/doctors/${id}`);
    loadData();
  };

  const deletePatient = async (id) => {
    if (!window.confirm("Delete patient?")) return;

    await API.delete(`/patient/${id}`);
    loadData();
  };

  const logout = () => {
    localStorage.removeItem("admin");
    navigate('/');
  };

  return (
    <div style={{ display: 'flex' }}>

      <Sidebar logout={logout} />

      <div style={{ flex: 1, padding: '25px' }}>

        <h2>Admin Dashboard</h2>

        {/* DOCTORS */}
        <h4 className="mt-4">Doctors</h4>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(d => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.specialization}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteDoctor(d.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PATIENTS */}
        <h4 className="mt-4">Patients</h4>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deletePatient(p.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}

export default AdminDashboard;

