import { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import DoctorMonthlySlotManager from '../components/DoctorMonthlySlotManager';

function DoctorSlots() {
  const [slotTime, setSlotTime] = useState('');
  const [adding, setAdding] = useState(false);
  const [doctorId, setDoctorId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;
        const res = await API.get(`/doctors/user/${userId}`);
        setDoctorId(res.data.doctor_id);
      } catch (err) {
        console.error("❌ Failed to load doctor info", err);
      }
    };
    loadDoctor();
  }, []);

  const addSlot = async () => {
    if (!slotTime) {
      alert("Select date & time");
      return;
    }

    setAdding(true);
    try {
      const formatted = slotTime.replace('T', ' ') + ':00';
      await API.post('/slots', {
        doctor_id: doctorId,
        slot_time: formatted
      });

      alert("✅ Slot added successfully");
      setSlotTime('');
      setRefreshKey(prev => prev + 1); // Trigger refresh of the manager
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "❌ Failed to add slot");
    } finally {
      setAdding(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <>
      <h2 className="mb-4">⏰ Manage Availability</h2>

      {/* ADD SLOT */}
      <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-success text-white fw-bold py-3 px-4" style={{ borderRadius: '16px 16px 0 0' }}>
          Add New Available Slot
        </div>
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row gap-3">
            <div className="flex-grow-1">
              <label className="text-muted small fw-bold text-uppercase d-block mb-1">Select Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                style={{ borderRadius: '12px', padding: '12px' }}
                value={slotTime}
                min={getMinDateTime()}
                onChange={(e) => setSlotTime(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-end">
              <button
                className="btn btn-success w-100 px-4 py-md-3 fw-bold shadow-sm"
                style={{ borderRadius: '12px', minWidth: '160px' }}
                onClick={addSlot}
                disabled={adding}
              >
                {adding ? "Adding..." : "+ Create Slot"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY SLOT MANAGER */}
      <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-dark text-white fw-bold py-3 px-4" style={{ borderRadius: '16px 16px 0 0' }}>
          Availability Calendar
        </div>
        <div className="card-body p-0">
          {doctorId && (
            <DoctorMonthlySlotManager 
              key={refreshKey}
              doctorId={doctorId} 
            />
          )}
        </div>
      </div>
    </>
  );
}

export default DoctorSlots;