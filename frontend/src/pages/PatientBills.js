import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

function PatientBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  // ----------------------
  // GET PATIENT ID FROM TOKEN
  // ----------------------
  const getPatientId = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) throw new Error("No token found");

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      // ✅ FIXED ROUTE
      const res = await API.get(`/patients/user/${userId}`);

      if (!res.data?.patient_id) {
        throw new Error("Patient ID not found");
      }

      return res.data.patient_id;

    } catch (err) {
      console.error("❌ Failed to get patient ID:", err);
      throw err;
    }
  };

  // ----------------------
  // LOAD BILLS
  // ----------------------
  const loadBills = async () => {
    try {
      setLoading(true);

      const patientId = await getPatientId();
      const res = await API.get(`/bills/patient/${patientId}`);

      setBills(Array.isArray(res.data) ? res.data : []);

    } catch (err) {
      console.error("❌ Failed to load bills:", err);
      alert("Failed to load bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  // ----------------------
  // PAY BILL
  // ----------------------
  const handlePay = async (id) => {
    try {
      setPayingId(id);

      await API.put(`/bills/pay/${id}`, {
        payment_method: 'upi'
      });

      alert("Payment successful");

      setBills(prev =>
        prev.map(b =>
          b.id === id
            ? { ...b, status: 'paid', payment_method: 'upi' }
            : b
        )
      );

    } catch (err) {
      console.error("❌ Payment failed:", err);
      alert(err?.response?.data?.message || "Payment failed");
    }

    setPayingId(null);
  };

  // ----------------------
  // STATUS BADGE
  // ----------------------
  const getBadge = (status) => {
    if (status === 'paid') return 'bg-success';
    if (status === 'verified') return 'bg-primary';
    return 'bg-warning text-dark';
  };

  // ----------------------
  // UI
  // ----------------------
  return (
    <>
      <h2 className="mb-4">💳 My Invoices</h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted">Retrieving your billing records...</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-5 border rounded-4 bg-white shadow-sm">
          <div style={{ fontSize: '3rem' }}>💸</div>
          <h5 className="mt-3 fw-bold">No bills found</h5>
          <p className="text-muted">You have no pending or past billing records.</p>
        </div>
      ) : (
        <div className="row g-4">
          {bills.map(bill => (
            <div className="col-md-6 col-lg-4" key={bill.id}>
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1">Amount Due</label>
                      <h3 className="fw-bold mb-0 text-primary">₹{bill.amount}</h3>
                    </div>
                    <span className={`badge ${getBadge(bill.status)}`} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem' }}>
                      {bill.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-light p-3 rounded-3 mb-4 border border-light-subtle">
                    <div className="d-flex justify-content-between mb-2 small">
                      <span className="text-muted fw-semibold">Payment Mode</span>
                      <span className="text-dark fw-bold" style={{ textTransform: 'uppercase' }}>{bill.payment_method || 'PENDING'}</span>
                    </div>
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted fw-semibold">Billing Date</span>
                      <span className="text-dark fw-bold">Recent</span>
                    </div>
                  </div>

                  {bill.status === 'verified' && (
                    <button
                      className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
                      style={{ borderRadius: '12px' }}
                      onClick={() => handlePay(bill.id)}
                      disabled={payingId === bill.id}
                    >
                      {payingId === bill.id ? 'Processing...' : 'Pay with UPI'}
                    </button>
                  )}

                  {bill.status === 'pending' && (
                    <div className="alert alert-warning mb-0 p-2 text-center" style={{ borderRadius: '10px', fontSize: '0.85rem' }}>
                      <span className="me-2">⏳</span> Verification in progress
                    </div>
                  )}

                  {bill.status === 'paid' && (
                    <div className="alert alert-success mb-0 p-2 text-center fw-bold" style={{ borderRadius: '10px', fontSize: '0.85rem' }}>
                      <span className="me-2">✅</span> Payment Successful
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default PatientBills;