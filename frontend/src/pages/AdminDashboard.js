import { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Stethoscope, 
  Users, 
  Trash2, 
  UserCircle 
} from 'lucide-react';
import AppIcon from '../components/AppIcon';
import API from '../services/api';
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

      const patRes = await API.get('/patient/all');
      setPatients(patRes.data);

    } catch (err) {
      console.error(err);
    }
  };

  const deleteDoctor = async (id) => {
    if (!window.confirm("Are you sure you want to remove this doctor from the registry?")) return;
    try {
      await API.delete(`/doctors/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete doctor");
    }
  };

  const deletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to remove this patient from the registry?")) return;
    try {
      await API.delete(`/patient/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete patient");
    }
  };

  return (
    <>
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary text-white p-2 rounded-3 shadow-sm">
            <AppIcon icon={ShieldCheck} size={24} />
          </div>
          <div>
            <h2 className="fw-bold text-dark mb-0">Admin Management</h2>
            <p className="text-muted mb-0">Oversee and manage hospital practitioners and patients.</p>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* DOCTORS MANAGEMENT */}
        <div className="col-lg-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white py-3 border-0 px-4 d-flex align-items-center gap-2" style={{ borderRadius: '16px 16px 0 0' }}>
              <AppIcon icon={Stethoscope} size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Doctor Directory</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Practitioner Name</th>
                      <th>Specialization</th>
                      <th className="pe-4 text-end">Management</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-4 text-muted">No doctors found in registry.</td></tr>
                    ) : (
                      doctors.map(d => (
                        <tr key={d.id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center gap-2">
                              <AppIcon icon={UserCircle} size={16} className="text-muted" />
                              <span className="fw-semibold text-dark">{d.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2" style={{ borderRadius: '8px' }}>{d.specialization}</span>
                          </td>
                          <td className="pe-4 text-end">
                            <button
                              className="btn btn-outline-danger btn-sm px-3 d-inline-flex align-items-center gap-2"
                              style={{ borderRadius: '8px' }}
                              onClick={() => deleteDoctor(d.id)}
                            >
                              <AppIcon icon={Trash2} size={14} />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* PATIENTS MANAGEMENT */}
        <div className="col-lg-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white py-3 border-0 px-4 d-flex align-items-center gap-2" style={{ borderRadius: '16px 16px 0 0' }}>
              <AppIcon icon={Users} size={20} className="text-success" />
              <h5 className="mb-0 fw-bold">Patient Registry</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Patient Name</th>
                      <th className="pe-4 text-end">Management</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length === 0 ? (
                      <tr><td colSpan="2" className="text-center py-4 text-muted">No patients found in registry.</td></tr>
                    ) : (
                      patients.map(p => (
                        <tr key={p.id}>
                          <td className="ps-4 fw-semibold text-dark">
                            <div className="d-flex align-items-center gap-2">
                              <AppIcon icon={UserCircle} size={16} className="text-muted" />
                              <span>{p.name}</span>
                            </div>
                          </td>
                          <td className="pe-4 text-end">
                            <button
                              className="btn btn-outline-danger btn-sm px-3 d-inline-flex align-items-center gap-2"
                              style={{ borderRadius: '8px' }}
                              onClick={() => deletePatient(p.id)}
                            >
                              <AppIcon icon={Trash2} size={14} />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;

