import { useState } from 'react';
import API from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    age: '',
    gender: '',
    specialization: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await API.post('/auth/register', form);
      alert('Registered successfully');
      navigate('/');
    } catch {
      alert('Registration failed');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">

      <form className="p-4 bg-white shadow rounded" onSubmit={handleRegister}>
        <h3 className="mb-3">Register</h3>

        {/* Common Fields */}
        <input
          className="form-control mb-2"
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />

        <input
          className="form-control mb-2"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          type="password"
          className="form-control mb-2"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        {/* Role Selection */}
        <select
          className="form-control mb-3"
          name="role"
          onChange={handleChange}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>

        {/* Patient Fields */}
        {form.role === 'patient' && (
          <>
            <input
              className="form-control mb-2"
              name="age"
              placeholder="Age"
              onChange={handleChange}
            />

            <input
              className="form-control mb-2"
              name="gender"
              placeholder="Gender"
              onChange={handleChange}
            />
          </>
        )}

        {/* Doctor Fields */}
        {form.role === 'doctor' && (
          <input
            className="form-control mb-2"
            name="specialization"
            placeholder="Specialization"
            onChange={handleChange}
          />
        )}

        <button className="btn btn-success w-100">Register</button>

        <p className="mt-3 text-center">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>

    </div>
  );
}

export default Register;