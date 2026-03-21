import { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function DoctorSlots() {
  const [slotTime, setSlotTime] = useState('');
  const [adding, setAdding] = useState(false);

  // ✅ NEW STATE
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const navigate = useNavigate();

  // ----------------------
  // GET DOCTOR ID
  // ----------------------
  const getDoctorId = async () => {
    const token = localStorage.getItem('token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;

    const res = await API.get(`/doctors/user/${userId}`);
    return res.data.doctor_id;
  };

  // ----------------------
  // LOAD SLOTS (NEW)
  // ----------------------
  const loadSlots = async () => {
    setLoadingSlots(true);

    try {
      const doctorId = await getDoctorId();

      console.log("🔥 Fetching slots for:", doctorId);

      const res = await API.get(`/slots/${doctorId}`);

      console.log("🔥 Slots:", res.data);

      setSlots(res.data || []);

    } catch (err) {
      console.error("❌ Slot fetch error:", err);
    }

    setLoadingSlots(false);
  };

  // ----------------------
  // LOAD ON PAGE OPEN
  // ----------------------
  useEffect(() => {
    loadSlots();
  }, []);

  // ----------------------
  // ADD SLOT
  // ----------------------
  const addSlot = async () => {
    if (!slotTime) {
      alert("Select date & time");
      return;
    }

    setAdding(true);

    try {
      const doctorId = await getDoctorId();

      const formatted = new Date(slotTime)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      await API.post('/slots', {
        doctor_id: doctorId,
        slot_time: formatted
      });

      alert("Slot added successfully");
      setSlotTime('');

      // ✅ REFRESH SLOTS AFTER ADD
      loadSlots();

    } catch (err) {
      console.error(err);
      alert("Failed to add slot");
    }

    setAdding(false);
  };

  // ----------------------
  // LOGOUT
  // ----------------------
  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <Sidebar logout={logout} />

      <div style={{ flex: 1, padding: '25px', background: '#f1f5f9' }}>

        <h2 className="mb-4">Manage Slots</h2>

        {/* ---------------------- */}
        {/* ADD SLOT */}
        {/* ---------------------- */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white fw-bold">
            Add Available Slot
          </div>

          <div className="card-body">

            <input
              type="datetime-local"
              className="form-control mb-3"
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
            />

            <button
              className="btn btn-success"
              onClick={addSlot}
              disabled={adding}
            >
              {adding ? "Adding..." : "Add Slot"}
            </button>

          </div>
        </div>

        {/* ---------------------- */}
        {/* SLOT LIST (NEW) */}
        {/* ---------------------- */}
        <div className="card shadow-sm">
          <div className="card-header bg-dark text-white fw-bold">
            My Slots
          </div>

          <div className="card-body">

            {loadingSlots ? (
              <p>Loading slots...</p>
            ) : slots.length === 0 ? (
              <p>No slots available</p>
            ) : (
              <ul className="list-group">
                {slots.map(slot => (
                  <li key={slot.id} className="list-group-item">
                    {new Date(slot.slot_time).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default DoctorSlots;