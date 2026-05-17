import { useState } from 'react';
import API from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

function Register() {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    age: '',
    gender: '',
    specialization: ''
  });

  // ----------------------
  // HANDLE INPUT CHANGE
  // ----------------------

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ----------------------
  // REGISTER
  // ----------------------

  const handleRegister = async (e) => {

    e.preventDefault();

    try {

      await API.post('/auth/register', form);

      alert('Registered successfully');

      navigate('/');

    } catch (err) {

      console.error(
        '❌ Register Error:',
        err
      );

      alert('Registration failed');
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

        .register-container{

          width:100%;
          height:100vh;

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

          padding:20px;
        }

        .circle{
          position:absolute;
          border-radius:50%;
          background:rgba(255,255,255,0.05);
        }

        .circle1{
          width:280px;
          height:280px;
          top:-100px;
          left:-100px;
        }

        .circle2{
          width:220px;
          height:220px;
          bottom:-80px;
          right:-80px;
        }

        .register-card{

          width:900px;
          min-height:620px;

          background:rgba(255,255,255,0.08);

          border:1px solid rgba(255,255,255,0.12);

          backdrop-filter:blur(14px);

          border-radius:28px;

          display:flex;

          overflow:hidden;

          box-shadow:
            0 10px 40px rgba(0,0,0,0.30);

          animation:fadeUp 0.8s ease;
        }

        @keyframes fadeUp{

          from{
            opacity:0;
            transform:translateY(30px);
          }

          to{
            opacity:1;
            transform:translateY(0);
          }
        }

        /* LEFT SIDE */

        .left-side{

          width:40%;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.12),
              rgba(255,255,255,0.03)
            );

          padding:40px;

          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items:center;

          text-align:center;
        }

        .logo{

          width:90px;
          height:90px;

          border-radius:24px;

          background:white;

          display:flex;
          justify-content:center;
          align-items:center;

          font-size:38px;
          font-weight:700;

          color:#2563eb;

          margin-bottom:25px;
        }

        .left-side h1{

          color:white;

          font-size:34px;

          margin-bottom:15px;
        }

        .left-side p{

          color:#dbeafe;

          font-size:15px;

          line-height:1.7;
        }

        /* RIGHT SIDE */

        .right-side{

          width:60%;

          padding:40px;

          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .form-title{

          color:white;

          font-size:30px;

          margin-bottom:30px;

          text-align:center;
        }

        .form-grid{

          display:grid;

          grid-template-columns:1fr 1fr;

          gap:20px;
        }

        .input-group{
          position:relative;
        }

        .input-group.full{
          grid-column:1 / 3;
        }

        .input-group label{

          display:block;

          margin-bottom:8px;

          color:#e2e8f0;

          font-size:14px;

          font-weight:500;
        }

        .input-group input,
        .input-group select{

          width:100%;

          padding:14px 16px;

          border:none;
          outline:none;

          border-radius:14px;

          background:rgba(255,255,255,0.10);

          color:white;

          font-size:14px;

          border:1px solid rgba(255,255,255,0.12);

          transition:0.3s;
        }

        .input-group input::placeholder{
          color:#cbd5e1;
        }

        .input-group select option{
          background:#1e293b;
          color:white;
        }

        .input-group input:focus,
        .input-group select:focus{

          border-color:#60a5fa;

          box-shadow:
            0 0 0 4px
            rgba(96,165,250,0.15);
        }

        .toggle-password{

          position:absolute;

          right:14px;
          top:43px;

          color:#cbd5e1;

          cursor:pointer;

          font-size:12px;
        }

        .register-btn{

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

          margin-top:30px;
        }

        .register-btn:hover{

          transform:translateY(-2px);

          background:#dbeafe;
        }

        .bottom-text{

          margin-top:20px;

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

        @media(max-width:950px){

          body{
            overflow:auto;
          }

          .register-container{
            height:auto;
            padding:30px 15px;
          }

          .register-card{

            width:100%;

            flex-direction:column;
          }

          .left-side,
          .right-side{
            width:100%;
          }

          .left-side{
            padding:30px;
          }

          .right-side{
            padding:30px 20px;
          }

          .form-grid{
            grid-template-columns:1fr;
          }

          .input-group.full{
            grid-column:auto;
          }
        }

      `}</style>

      <div className="register-container">

        <div className="circle circle1"></div>
        <div className="circle circle2"></div>

        <div className="register-card">

          {/* LEFT SIDE */}

          <div className="left-side">

            <div className="logo">
              M
            </div>

            <h1>
              Medical Portal
            </h1>

            <p>
              Create your account to access
              appointments, reports, medical
              records, and healthcare services
              securely from anywhere.
            </p>

          </div>

          {/* RIGHT SIDE */}

          <div className="right-side">

            <h2 className="form-title">
              Create Account
            </h2>

            <form onSubmit={handleRegister}>

              <div className="form-grid">

                {/* NAME */}

                <div className="input-group">

                  <label>Full Name</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* EMAIL */}

                <div className="input-group">

                  <label>Email Address</label>

                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* PASSWORD */}

                <div className="input-group">

                  <label>Password</label>

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    name="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />

                  <span
                    className="toggle-password"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword
                      ? 'Hide'
                      : 'Show'}
                  </span>

                </div>

                {/* ROLE */}

                <div className="input-group">

                  <label>Select Role</label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >

                    <option value="patient">
                      Patient
                    </option>

                    <option value="doctor">
                      Doctor
                    </option>

                  </select>

                </div>

                {/* PATIENT FIELDS */}

                {form.role === 'patient' && (
                  <>
                    <div className="input-group">

                      <label>Age</label>

                      <input
                        type="number"
                        name="age"
                        placeholder="Enter age"
                        value={form.age}
                        onChange={handleChange}
                        required
                      />

                    </div>

                    <div className="input-group">

                      <label>Gender</label>

                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        required
                      >

                        <option value="">
                          Select Gender
                        </option>

                        <option value="male">
                          Male
                        </option>

                        <option value="female">
                          Female
                        </option>

                      </select>

                    </div>
                  </>
                )}

                {/* DOCTOR */}

                {form.role === 'doctor' && (
                  <div className="input-group full">

                    <label>
                      Specialization
                    </label>

                    <select
                      name="specialization"
                      value={form.specialization}
                      onChange={handleChange}
                      required
                    >

                      <option value="">
                        Select Specialization
                      </option>

                      <option value="Cardiologist">
                        Cardiologist
                      </option>

                      <option value="Dermatologist">
                        Dermatologist
                      </option>

                      <option value="Neurologist">
                        Neurologist
                      </option>

                      <option value="Orthopedic">
                        Orthopedic
                      </option>

                      <option value="Pediatrician">
                        Pediatrician
                      </option>

                      <option value="General Physician">
                        General Physician
                      </option>

                    </select>

                  </div>
                )}

              </div>

              <button
                type="submit"
                className="register-btn"
              >
                Register
              </button>

            </form>

            <div className="bottom-text">

              Already have an account?{' '}

              <Link to="/login">
                Login
              </Link>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default Register;