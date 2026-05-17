import { useState } from 'react';
import API from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = res.data;

      // Store token + role
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);

      console.log('✅ Login success:', user.role);

      // Role-based navigation
      if (user.role === 'patient') {
        navigate('/dashboard');
      } else if (user.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin');
      }

    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message ||
        'Invalid email or password';

      alert(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
          font-family:'Poppins',sans-serif;
        }

        body{
          overflow:hidden;
        }

        .login-container{
          width:100%;
          min-height:100vh;

          display:flex;
          justify-content:center;
          align-items:center;

          background:
            linear-gradient(
              135deg,
              #0f172a 0%,
              #1e293b 50%,
              #2563eb 100%
            );

          position:relative;
          overflow:hidden;
        }

        .circle{
          position:absolute;
          border-radius:50%;
          background:rgba(255,255,255,0.06);
          backdrop-filter:blur(10px);
        }

        .circle1{
          width:300px;
          height:300px;
          top:-80px;
          left:-80px;
        }

        .circle2{
          width:250px;
          height:250px;
          bottom:-70px;
          right:-70px;
        }

        .login-card{
          width:420px;

          background:rgba(255,255,255,0.08);

          border:1px solid rgba(255,255,255,0.12);

          backdrop-filter:blur(18px);

          border-radius:24px;

          padding:45px;

          box-shadow:
            0 10px 40px rgba(0,0,0,0.3);

          animation:fadeUp 0.8s ease;
        }

        @keyframes fadeUp{
          from{
            opacity:0;
            transform:translateY(40px);
          }

          to{
            opacity:1;
            transform:translateY(0);
          }
        }

        .logo{
          width:85px;
          height:85px;

          margin:0 auto 20px;

          border-radius:20px;

          background:white;

          display:flex;
          justify-content:center;
          align-items:center;

          font-size:35px;
          font-weight:700;

          color:#2563eb;

          box-shadow:0 8px 25px rgba(0,0,0,0.15);
        }

        .title{
          text-align:center;
          margin-bottom:35px;
        }

        .title h1{
          color:white;
          font-size:32px;
          margin-bottom:8px;
        }

        .title p{
          color:#cbd5e1;
          font-size:15px;
        }

        .input-group{
          margin-bottom:22px;
          position:relative;
        }

        .input-group label{
          display:block;
          margin-bottom:8px;
          color:#e2e8f0;
          font-size:14px;
          font-weight:500;
        }

        .input-group input{
          width:100%;
          padding:14px 16px;

          border:none;
          outline:none;

          border-radius:14px;

          background:rgba(255,255,255,0.10);

          color:white;

          font-size:15px;

          border:1px solid rgba(255,255,255,0.12);

          transition:0.3s;
        }

        .input-group input:focus{
          border-color:#60a5fa;
          box-shadow:0 0 0 4px rgba(96,165,250,0.15);
        }

        .input-group input::placeholder{
          color:#cbd5e1;
        }

        .toggle-password{
          position:absolute;
          right:16px;
          top:45px;

          color:#cbd5e1;
          cursor:pointer;
          font-size:13px;
        }

        .options{
          display:flex;
          justify-content:space-between;
          align-items:center;

          margin-bottom:28px;

          color:#e2e8f0;
          font-size:14px;
        }

        .options a{
          color:#93c5fd;
          text-decoration:none;
        }

        .options a:hover{
          text-decoration:underline;
        }

        .login-btn{
          width:100%;

          padding:15px;

          border:none;
          outline:none;

          border-radius:14px;

          background:white;

          color:#0f172a;

          font-size:16px;
          font-weight:600;

          cursor:pointer;

          transition:0.3s;
        }

        .login-btn:hover{
          transform:translateY(-2px);
          background:#dbeafe;
        }

        .login-btn:disabled{
          background:gray;
          cursor:not-allowed;
          transform:none;
        }

        .bottom-text{
          margin-top:28px;
          text-align:center;
          color:#cbd5e1;
          font-size:14px;
        }

        .bottom-text a{
          color:#93c5fd;
          text-decoration:none;
          font-weight:600;
        }

        .bottom-text a:hover{
          text-decoration:underline;
        }

        @media(max-width:500px){

          .login-card{
            width:92%;
            padding:35px 25px;
          }

          .title h1{
            font-size:26px;
          }
        }

      `}</style>

      <div className="login-container">

        <div className="circle circle1"></div>
        <div className="circle circle2"></div>

        <div className="login-card">

          <div className="logo">
            M
          </div>

          <div className="title">
            <h1>Medical Portal</h1>
            <p>Login to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin}>

            <div className="input-group">

              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

            <div className="input-group">

              <label>Password</label>

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <span
                className="toggle-password"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword
                  ? 'Hide'
                  : 'Show'}
              </span>

            </div>

            <div className="options">

              <label>
                <input
                  type="checkbox"
                  style={{ marginRight: '6px' }}
                />
                Remember me
              </label>

              <a href="#">
                Forgot Password?
              </a>

            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading
                ? 'Logging in...'
                : 'Login'}
            </button>

          </form>

          <div className="bottom-text">
            Don't have an account?{' '}
            <Link to="/register">
              Register
            </Link>
          </div>

        </div>

      </div>
    </>
  );
}

export default Login;