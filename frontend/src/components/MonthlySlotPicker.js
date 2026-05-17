import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import './MonthlySlotPicker.css';

const MonthlySlotPicker = ({ doctorId, onSlotSelect, selectedSlotId }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState({});

  const fetchSlots = useCallback(async (year, month) => {
    const cacheKey = `${doctorId}-${year}-${month}`;
    if (cache[cacheKey]) {
      setMonthlyData(cache[cacheKey]);
      return;
    }

    setLoading(true);
    try {
      const res = await API.get('/slots/monthly', {
        params: { doctorId, year, month }
      });
      const data = res.data[`${year}-${String(month).padStart(2, '0')}`] || {};
      setMonthlyData(data);
      setCache(prev => ({ ...prev, [cacheKey]: data }));
    } catch (err) {
      console.error("Fetch Slots Error:", err);
      setMonthlyData({});
    } finally {
      setLoading(false);
    }
  }, [doctorId, cache]);

  useEffect(() => {
    if (doctorId) {
      fetchSlots(currentYear, currentMonth);
    }
  }, [doctorId, currentYear, currentMonth, fetchSlots]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePrevMonth = () => {
    const now = new Date();
    if (currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1) return;

    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const formatDateLabel = (dateStr) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  };

  if (!doctorId) return (
    <div className="empty-state">
      <p>Please select a doctor to see their availability.</p>
    </div>
  );

  return (
    <div className="slot-picker-container mt-3">
      <div className="month-nav">
        <button 
          className="nav-btn" 
          onClick={handlePrevMonth} 
          disabled={currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth() + 1}
        >
          &lt;
        </button>
        <h5>{months[currentMonth - 1]} {currentYear}</h5>
        <button className="nav-btn" onClick={handleNextMonth}>
          &gt;
        </button>
      </div>

      {loading ? (
        <div className="loading-skeleton p-4">
          <div style={{height: '20px', background: '#f1f5f9', width: '40%', borderRadius: '4px'}}></div>
          <div className="d-flex gap-2 mt-2">
            {[1, 2, 3].map(i => <div key={i} style={{height: '40px', background: '#f1f5f9', width: '80px', borderRadius: '8px'}}></div>)}
          </div>
        </div>
      ) : Object.keys(monthlyData).length === 0 ? (
        <div className="empty-state">
          <p>No available slots found for this month.</p>
        </div>
      ) : (
        <div className="date-grid">
          {Object.entries(monthlyData).map(([date, slots]) => (
            <div key={date} className="date-card d-flex align-items-start gap-4">
              <div className="date-info-box" style={{ minWidth: '160px' }}>
                <span className="date-badge mb-1 d-inline-block">{getDayName(date)}</span>
                <div className="date-label">{formatDateLabel(date)}</div>
              </div>
              <div className="slots-wrapper flex-grow-1">
                {slots.map(slot => (
                  <button
                    key={slot.slot_id}
                    type="button"
                    className={`slot-btn ${slot.is_booked ? 'booked' : (selectedSlotId === slot.slot_id ? 'selected' : '')}`}
                    disabled={slot.is_booked}
                    onClick={() => onSlotSelect(slot.slot_id)}
                  >
                    {!slot.is_booked && <div className={`status-dot ${selectedSlotId === slot.slot_id ? 'bg-white' : 'status-available'}`}></div>}
                    {slot.time}
                    {slot.is_booked && <span className="booked-text">Full</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthlySlotPicker;
