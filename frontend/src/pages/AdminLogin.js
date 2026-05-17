import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function AdminLogin() {
  const [email, setEmail] = useState('admin@hms.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the standard secure backend auth login endpoint
      const res = await API.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = res.data;

      if (user.role !== 'admin') {
        alert("Access Denied: This portal is reserved for Hospital Administrators.");
        setLoading(false);
        return;
      }

      // Store authentic JWT token + role metadata
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'admin');
      localStorage.setItem('admin', 'true'); // Backward compatibility with App.js ProtectedRoute

      console.log('✅ Admin Login success');
      navigate('/admin');

    } catch (err) {
      console.error("❌ Admin Login Error:", err);
      const message = err.response?.data?.message || 'Invalid administrator credentials';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }

        body {
          overflow: hidden;
        }

        .admin-login-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #581c87 100%);
          position: relative;
          overflow: hidden;
        }

        .admin-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px);
        }

        .admin-circle1 {
          width: 320px;
          height: 320px;
          top: -60px;
          left: -60px;
        }

        .admin-circle2 {
          width: 280px;
          height: 280px;
          bottom: -50px;
          right: -50px;
        }

        .admin-login-card {
          width: 430px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 26px;
          padding: 50px 45px;
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.4);
          animation: adminFadeUp 0.8s ease;
        }

        @keyframes adminFadeUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .admin-logo {
          width: 90px;
          height: 90px;
          margin: 0 auto 25px;
          border-radius: 22px;
          background: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 38px;
          font-weight: 700;
          color: #6b21a8;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .admin-title {
          text-align: center;
          margin-bottom: 35px;
        }

        .admin-title h1 {
          color: white;
          font-size: 30px;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .admin-title p {
          color: #c084fc;
          font-size: 14px;
        }

        .admin-input-group {
          margin-bottom: 24px;
          position: relative;
        }

        .admin-input-group label {
          display: block;
          margin-bottom: 8px;
          color: #f3e8ff;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-input-group input {
          width: 100%;
          padding: 15px 16px;
          border: none;
          outline: none;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: 0.3s;
        }

        .admin-input-group input:focus {
          border-color: #d8b4fe;
          box-shadow: 0 0 0 4px rgba(216, 180, 254, 0.15);
        }

        .admin-input-group input::placeholder {
          color: #d8b4fe;
          opacity: 0.6;
        }

        .admin-toggle-password {
          position: absolute;
          right: 16px;
          top: 43px;
          color: #d8b4fe;
          cursor: pointer;
          font-size: 13px;
          user-select: none;
        }

        .admin-login-btn {
          width: 100%;
          padding: 16px;
          border: none;
          outline: none;
          border-radius: 14px;
          background: #c084fc;
          color: #1e1b4b;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 15px;
          box-shadow: 0 4px 15px rgba(192, 132, 252, 0.3);
        }

        .admin-login-btn:hover {
          transform: translateY(-2px);
          background: #e9d5ff;
          box-shadow: 0 6px 20px rgba(192, 132, 252, 0.4);
        }

        .admin-login-btn:disabled {
          background: #6b21a8;
          color: #c084fc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .admin-bottom-text {
          margin-top: 30px;
          text-align: center;
          color: #d8b4fe;
          font-size: 13px;
        }

        .admin-bottom-text a {
          color: white;
          text-decoration: none;
          font-weight: 600;
        }

        .admin-bottom-text a:hover {
          text-decoration: underline;
        }

        @media(max-width: 500px) {
          .admin-login-card {
            width: 90%;
            padding: 35px 25px;
          }
          .admin-title h1 {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="admin-login-container">
        <div className="admin-circle admin-circle1"></div>
        <div className="admin-circle admin-circle2"></div>

        <div className="admin-login-card">
          <div className="admin-logo">A</div>

          <div className="admin-title">
            <h1>Admin Desk</h1>
            <p>Authorized Operations Portal</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="admin-input-group">
              <label>Operator Email</label>
              <input
                type="email"
                placeholder="admin@hms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="admin-input-group">
              <label>Authorization Token</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="admin-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          <div className="admin-bottom-text">
            Standard Employee Portal? <Link to="/login">Click Here</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminLogin;
