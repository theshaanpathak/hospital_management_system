import { useState } from 'react';
import API from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { email, password });

      const { token, user } = res.data;

      // Store token + role
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);

      console.log("✅ Login success:", user.role);

      // ✅ FIXED ROUTES
      if (user.role === 'patient') {
        navigate('/dashboard');
      } else if (user.role === 'doctor') {
        navigate('/doctor-dashboard'); // 🔥 FIX HERE
      } else if (user.role === 'admin') {
        navigate('/admin');
      }

    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message || 'Invalid email or password';

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">

      <form
        className="p-4 bg-white shadow rounded"
        onSubmit={handleLogin}
        style={{ minWidth: '320px' }}
      >
        <h3 className="mb-3 text-center">Login</h3>

        <input
          type="email"
          className="form-control mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="form-control mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="mt-3 text-center">
          No account? <Link to="/register">Register</Link>
        </p>
      </form>

    </div>
  );
}

export default Login;