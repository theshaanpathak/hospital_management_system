
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === "12345678") {
      localStorage.setItem("admin", "true");
      navigate('/admin');
    } else {
      alert("Wrong password");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Admin Login</h2>

      <input
        type="password"
        className="form-control mb-3"
        placeholder="Enter admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn btn-dark" onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}

export default AdminLogin;
