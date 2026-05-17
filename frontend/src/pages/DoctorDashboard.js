import { useEffect, useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  ClipboardList, 
  Clock, 
  User,
  CreditCard,
  FileText,
  Stethoscope,
  Download
} from 'lucide-react';
import { Modal } from 'react-bootstrap';
import AppIcon from '../components/AppIcon';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../components/MonthlySlotPicker.css'; 

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // Billing modal
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [billAmount, setBillAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [markPaid, setMarkPaid] = useState(false);

  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [file, setFile] = useState(null);

  const [intakeDetails, setIntakeDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    loadAll();
  }, [navigate]);

  const getDoctorId = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const res = await API.get(`/doctors/user/${payload.id}`);
      return res.data.doctor_id;
    } catch (err) {
      console.error(err);
      alert("Failed to load doctor data");
      throw err;
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const doctorId = await getDoctorId();
      const res = await API.get(`/appointments/doctor/${doctorId}`);
      setAppointments(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load dashboard data");
    }
    setLoading(false);
  };

  const openBillingModal = async (appointmentId) => {
    setSelectedAppointment(appointmentId);
    setBillAmount(500);
    setPaymentMethod('upi');
    setMarkPaid(false);
    setNotes('');
    setPrescription('');
    setFile(null);
    setShowBillingModal(true);
    
    // Fetch intake details
    setLoadingDetails(true);
    try {
      const res = await API.get(`/appointments/details/${appointmentId}`);
      setIntakeDetails(res.data);
    } catch (err) {
      console.error("Error fetching intake details:", err);
      setIntakeDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const confirmApproval = async (status, appointmentId = selectedAppointment) => {
    if (!appointmentId) return;
    setUpdatingId(appointmentId);

    try {
      if (status === 'approved') {
        // 1. Update status to approved
        await API.put(`/appointments/${appointmentId}/status`, { status: 'approved' });
        
        // 2. Save clinical details (prescription, doctor notes)
        const app = appointments.find(a => a.id === appointmentId);
        const formData = new FormData();
        formData.append('notes', notes);
        formData.append('prescription', prescription);
        if (file) formData.append('file', file);

        await API.post(`/appointments/details/${appointmentId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // 3. Create bill
        await API.post('/bills', {
          patient_id: app.patient_id,
          appointment_id: appointmentId,
          amount: Number(billAmount),
          payment_method: paymentMethod
        });

        if (markPaid) {
          const billRes = await API.get('/bills');
          const createdBill = billRes.data.find(b => b.appointment_id === appointmentId);
          if (createdBill) await API.put(`/bills/pay/${createdBill.id}`, { payment_method: paymentMethod });
        }
      } else {
        await API.put(`/appointments/${appointmentId}/status`, { status: 'rejected' });
      }

      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a));
      setShowBillingModal(false);
      setSelectedAppointment(null);
      setIntakeDetails(null);
      alert(`Appointment ${status} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to process request: " + (err.response?.data?.message || err.message));
    }
    setUpdatingId(null);
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleNextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const getGroupedAppointments = () => {
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const filtered = appointments.filter(app => app.date.startsWith(monthStr));
    
    const groups = {};
    filtered.forEach(app => {
      const date = app.date.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(app);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const getBadge = (status) => {
    if (status === 'approved') return 'bg-success';
    if (status === 'rejected') return 'bg-danger';
    return 'bg-warning text-dark';
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="fw-bold text-dark">Doctor Dashboard</h2>
        <p className="text-muted">Manage your patient appointments and consultations.</p>
      </div>

      <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
          <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center" style={{ borderRadius: '16px 16px 0 0' }}>
            <div className="d-flex align-items-center gap-2">
              <AppIcon icon={Calendar} size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Appointment Calendar</h5>
            </div>
            <div className="month-nav m-0 p-1 bg-light rounded-3 d-flex align-items-center border">
              <button className="nav-btn border-0 bg-transparent" onClick={handlePrevMonth} style={{ width: '30px', height: '30px' }}><AppIcon icon={ChevronLeft} size={16} /></button>
              <span className="mx-2 fw-bold small text-dark" style={{ minWidth: '110px', textAlign: 'center' }}>{months[currentMonth - 1]} {currentYear}</span>
              <button className="nav-btn border-0 bg-transparent" onClick={handleNextMonth} style={{ width: '30px', height: '30px' }}><AppIcon icon={ChevronRight} size={16} /></button>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="slot-picker-container shadow-none border-0 p-4 pt-2">
              {loading ? (
                <div className="loading-skeleton">
                  <div style={{ height: '80px', background: '#f1f5f9', borderRadius: '12px' }}></div>
                </div>
              ) : getGroupedAppointments().length === 0 ? (
                <div className="empty-state py-5 text-center">
                  <AppIcon icon={Clock} size={48} className="opacity-25 mb-3" />
                  <p className="text-muted">No appointments scheduled for this month.</p>
                </div>
              ) : (
                <div className="date-grid mt-2">
                  {getGroupedAppointments().map(([date, apps]) => (
                    <div key={date} className="date-card d-flex align-items-start gap-4 py-3">
                      <div className="date-info-box" style={{ minWidth: '140px' }}>
                        <span className="date-badge mb-1">{new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                        <div className="date-label fw-bold">{new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex flex-column gap-2">
                          {apps.map(app => (
                            <div key={app.id} className="d-flex align-items-center justify-content-between p-3 border rounded-4 bg-white hover-shadow-sm transition-all" style={{ border: '1px solid #f1f5f9 !important' }}>
                              <div className="d-flex align-items-center gap-3">
                                <div className="bg-primary-subtle text-primary px-2 py-1 rounded small fw-bold" style={{ minWidth: '70px', textAlign: 'center' }}>{new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                <div>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="fw-bold text-dark">{app.patient_name}</div>
                                    <span className="badge bg-light text-muted border-0 fw-bold" style={{ fontSize: '10px', background: '#f8fafc' }}>#AID-{app.id}</span>
                                  </div>
                                  <div className="text-muted small d-flex align-items-center gap-1">
                                    <AppIcon icon={User} size={12} /> Patient ID: #{app.patient_id}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-3">
                                <span className={`badge rounded-pill ${getBadge(app.status)}`} style={{ fontSize: '0.65rem', padding: '5px 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{app.status}</span>
                                {app.status === 'pending' && (
                                  <div className="d-flex gap-2">
                                    <button className="btn btn-sm btn-success px-3 d-flex align-items-center gap-1" style={{ borderRadius: '8px', fontSize: '0.75rem' }} onClick={() => openBillingModal(app.id)} disabled={updatingId}>
                                      <AppIcon icon={Check} size={14} /> Approve
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger px-3 d-flex align-items-center gap-1" style={{ borderRadius: '8px', fontSize: '0.75rem' }} onClick={() => confirmApproval('rejected', app.id)} disabled={updatingId}>
                                      <AppIcon icon={X} size={14} /> {updatingId === app.id ? '...' : 'Reject'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* APPROVAL & CONSULTATION MODAL */}
      <Modal show={showBillingModal} onHide={() => setShowBillingModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <div className="bg-primary-subtle text-primary p-2 rounded-3">
              <AppIcon icon={ClipboardList} size={24} />
            </div>
            Process Appointment Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <div className="row g-4">
            {/* LEFT: PATIENT INTAKE INFO */}
            <div className="col-md-5">
              <div className="p-3 bg-light rounded-4 h-100 border border-light-subtle">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <AppIcon icon={User} size={16} className="text-muted" /> Patient Intake Form
                </h6>
                
                {loadingDetails ? (
                  <div className="text-center py-4 text-muted small">Loading intake data...</div>
                ) : intakeDetails ? (
                  <div className="vstack gap-3">
                    <div>
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Symptoms</label>
                      <div className="p-2 bg-white rounded-2 small text-dark border">{intakeDetails.notes}</div>
                    </div>
                    {intakeDetails.duration && (
                      <div>
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Duration</label>
                        <div className="fw-bold small text-dark px-2">{intakeDetails.duration}</div>
                      </div>
                    )}
                    {intakeDetails.medical_history && (
                      <div>
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">History</label>
                        <div className="p-2 bg-white rounded-2 small text-muted border">{intakeDetails.medical_history}</div>
                      </div>
                    )}
                    {intakeDetails.medications && (
                      <div>
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Current Medications</label>
                        <div className="p-2 bg-white rounded-2 small text-muted border">{intakeDetails.medications}</div>
                      </div>
                    )}
                    {intakeDetails.attachment && (
                      <div className="mt-2">
                        <a 
                          href={`http://localhost:5000/uploads/${intakeDetails.attachment}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                          style={{ borderRadius: '8px' }}
                        >
                          <AppIcon icon={FileText} size={14} /> View Attached Report
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted small">No intake details available.</div>
                )}
              </div>
            </div>

            {/* RIGHT: DOCTOR CONSULTATION */}
            <div className="col-md-7">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <AppIcon icon={Stethoscope} size={16} className="text-primary" /> Consultation & Approval
              </h6>

              <div className="mb-3">
                <label className="form-label small fw-bold">Prescription</label>
                <textarea
                  className="form-control"
                  style={{ borderRadius: '12px' }}
                  rows="3"
                  placeholder="Enter medications and dosage..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Doctor's Clinical Notes</label>
                <textarea
                  className="form-control"
                  style={{ borderRadius: '12px' }}
                  rows="2"
                  placeholder="Internal observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label small fw-bold">Consultation Fee (₹)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '12px 0 0 12px' }}>₹</span>
                    <input
                      type="number"
                      className="form-control border-start-0"
                      style={{ borderRadius: '0 12px 12px 0' }}
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label small fw-bold">Payment Mode</label>
                  <select
                    className="form-select"
                    style={{ borderRadius: '12px' }}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="upi">UPI / Online</option>
                    <option value="cash">Cash Payment</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Attach Scan/Report (Optional)</label>
                <input
                  type="file"
                  className="form-control"
                  style={{ borderRadius: '12px' }}
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>

              <div className="form-check form-switch mb-4 p-2 px-4 rounded-3 border bg-light d-flex align-items-center gap-3 ms-0">
                <input
                  className="form-check-input ms-0"
                  type="checkbox"
                  id="markPaid"
                  checked={markPaid}
                  onChange={(e) => setMarkPaid(e.target.checked)}
                />
                <label className="form-check-label small fw-bold mb-0" htmlFor="markPaid">
                  Mark consultation as paid
                </label>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button
                  className="btn btn-outline-danger flex-fill py-2 fw-bold"
                  style={{ borderRadius: '10px' }}
                  onClick={() => confirmApproval('rejected')}
                  disabled={updatingId}
                >
                  <AppIcon icon={X} size={16} className="me-2" /> Reject
                </button>
                <button
                  className="btn btn-primary flex-fill py-2 fw-bold shadow-sm"
                  style={{ borderRadius: '10px' }}
                  onClick={() => confirmApproval('approved')}
                  disabled={updatingId}
                >
                  <AppIcon icon={Check} size={16} className="me-2" /> 
                  {updatingId ? 'Processing...' : 'Approve & Save'}
                </button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
}
    </>
  );
}

export default DoctorDashboard;