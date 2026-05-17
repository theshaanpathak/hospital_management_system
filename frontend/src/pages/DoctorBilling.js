import React, { useEffect, useState } from 'react';
import API from '../services/api';

function DoctorBilling() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // ----------------------
  // GET DOCTOR ID
  // ----------------------
  const getDoctorId = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) throw new Error("No token found");

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const res = await API.get(`/doctors/user/${userId}`);

      if (!res.data?.doctor_id) {
        throw new Error("Doctor ID not found");
      }

      return res.data.doctor_id;

    } catch (err) {
      console.error("❌ Doctor ID error:", err);
      throw err;
    }
  };

  // ----------------------
  // LOAD BILLS
  // ----------------------
  const loadBills = async () => {
    try {
      setLoading(true);

      const doctorId = await getDoctorId();
      const res = await API.get(`/bills/doctor/${doctorId}`);

      setBills(Array.isArray(res.data) ? res.data : []);

    } catch (err) {
      console.error("❌ Load bills error:", err);
      alert("Failed to load billing data");
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  // ----------------------
  // VERIFY BILL
  // ----------------------
  const verifyBill = async (billId) => {
    try {
      setActionLoading(billId);

      await API.put(`/bills/verify/${billId}`);

      setBills(prev =>
        prev.map(b =>
          b.id === billId ? { ...b, status: 'verified' } : b
        )
      );

    } catch (err) {
      console.error(err);
      alert("Verification failed");
    }

    setActionLoading(null);
  };

  // ----------------------
  // PAY BILL
  // ----------------------
  const payBill = async (billId, method = 'upi') => {
    try {
      setActionLoading(billId);

      await API.put(`/bills/pay/${billId}`, {
        payment_method: method
      });

      setBills(prev =>
        prev.map(b =>
          b.id === billId ? { ...b, status: 'paid', payment_method: method } : b
        )
      );

    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }

    setActionLoading(null);
  };

  // ----------------------
  // STATUS BADGE
  // ----------------------
  const getBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-success';
      case 'verified':
        return 'bg-primary';
      case 'pending':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  };

  // ----------------------
  // UI
  // ----------------------
  return (
    <>
      <h2 className="mb-4">💰 Billing & Invoices</h2>

      <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-white border-0 py-3" style={{ borderRadius: '16px 16px 0 0' }}>
          <h5 className="mb-0 fw-bold">Recent Billing Records</h5>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : bills.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-0">No billing records found</p>
              </div>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Patient</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Method</th>
                    <th>Appointment ID</th>
                    <th className="pe-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="ps-4 fw-semibold text-dark">{bill.patient_name || bill.name || 'Unknown'}</td>
                      <td>₹{bill.amount || 0}</td>

                      <td>
                        <span className={`badge ${getBadgeClass(bill.status)}`} style={{ padding: '6px 12px', borderRadius: '6px' }}>
                          {bill.status.toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted small fw-bold" style={{ textTransform: 'uppercase' }}>
                          {bill.payment_method || 'N/A'}
                        </span>
                      </td>
                      <td><code className="small text-muted">{bill.appointment_id}</code></td>

                      <td className="pe-4">
                        {bill.status === 'pending' && (
                          <button
                            className="btn btn-primary btn-sm px-3 shadow-sm"
                            style={{ borderRadius: '8px' }}
                            onClick={() => verifyBill(bill.id)}
                            disabled={actionLoading === bill.id}
                          >
                            Verify Bill
                          </button>
                        )}

                        {bill.status === 'verified' && (
                          <button
                            className="btn btn-success btn-sm px-3 shadow-sm"
                            style={{ borderRadius: '8px' }}
                            onClick={() => payBill(bill.id)}
                            disabled={actionLoading === bill.id}
                          >
                            Mark Paid
                          </button>
                        )}

                        {bill.status === 'paid' && (
                          <div className="d-flex align-items-center gap-2 text-success fw-bold small">
                            <span>✅</span> Completed
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default DoctorBilling;