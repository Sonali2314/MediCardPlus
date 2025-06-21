import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'patient',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTabSwitch = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  
  //   try {
  //     const role = await login(formData.email, formData.password);
  //     toast.success('Login successful!');
  
  //     if (role === 'patient') navigate('/PatientDashboard');
  //     else if (role === 'doctor') navigate('/DoctorDashboard');
  //     else if (role === 'admin') navigate('/admin');
  //     else navigate('/');
  //   } catch (err) {
  //     toast.error(err.message || 'Login failed');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log("Attempting login with:", formData.email, "and role:", formData.role);
    
    try {
      console.log("Calling login function...");
      const role = await login(formData.email, formData.password, formData.role);
      console.log("Login response received, role:", role);
      
      toast.success('Login successful!');
      
      console.log("Attempting navigation to role-specific route");
      if (role === 'patient') navigate('/patient-dashboard');
      else if (role === 'doctor') navigate('/doctor-dashboard');
      else if (role === 'admin') navigate('/admin-panel');
      else navigate('/');
    } catch (err) {
      console.error("Login error:", err);
      // Handle specific error messages
      if (err.message.includes('pending approval')) {
        toast.error('Your doctor account is pending approval from admin. Please wait for verification.');
      } else if (err.message.includes('Invalid credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (err.message.includes('not activated')) {
        toast.error('Your account is not activated. Please contact support.');
      } else {
        toast.error(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-sidebar">
          <h2>Welcome to MediCard+</h2>
          <p>Access your unified medical records platform and enjoy:</p>
          <ul>
            <li>Secure access to your complete medical history</li>
            <li>Share records with healthcare providers</li>
            <li>Track medications and appointments</li>
            <li>Receive personalized health insights</li>
          </ul>
        </div>
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Sign In</h2>
            <p>Select your user type to continue</p>
          </div>

{/* Add an "Admin" tab button in the login-tabs div */}
<div className="login-tabs">
  <button
    className={formData.role === 'patient' ? 'active' : ''}
    onClick={() => handleTabSwitch('patient')}
  >
    Patient
  </button>
  <button
    className={formData.role === 'doctor' ? 'active' : ''}
    onClick={() => handleTabSwitch('doctor')}
  >
    Doctor
  </button>
  <button
    className={formData.role === 'admin' ? 'active' : ''}
    onClick={() => handleTabSwitch('admin')}
  >
    Admin
  </button>
</div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div className="form-footer">
              <p>
                Forgot password? <Link to="/reset">Reset it</Link>
              </p>
              <p>
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;