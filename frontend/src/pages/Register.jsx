import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState('patient');
  const [formData, setFormData] = useState({
    // Common fields
    email: '',
    password: '',
    confirmPassword: '',
    
    // Patient fields
    fullName: '',
    age: '',
    gender: 'Male',
    contactNumber: '',
    address: '',
    governmentId: '',
    bloodGroup: 'Unknown',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    
    // Doctor fields
    name: '',
    specialization: '',
    hospitalName: '',
    registrationNumber: '',
    medicalLicense: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when it's changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      
      // Clear error for this field when it's changed
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate common fields
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (userType === 'patient') {
      // Validate patient fields
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.age) newErrors.age = 'Age is required';
      else if (isNaN(formData.age) || parseInt(formData.age) <= 0) newErrors.age = 'Please enter a valid age';
      
      if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
      if (!formData.address) newErrors.address = 'Address is required';
    } else if (userType === 'doctor') {
      // Validate doctor fields
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
      if (!formData.hospitalName) newErrors.hospitalName = 'Hospital name is required';
      if (!formData.registrationNumber) newErrors.registrationNumber = 'Registration number is required';
      if (!formData.medicalLicense) newErrors.medicalLicense = 'Medical license is required';
      if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
    }
    else if (userType === 'admin') {
        // Validate admin fields
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.adminId) newErrors.adminId = 'Admin ID is required';
        if (!formData.secretKey) newErrors.secretKey = 'Secret Key is required';
        if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
      }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors and debug info
    setErrors({});
    setDebugInfo(null);
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const formPayload = new FormData();
      
      // Add common fields
      formPayload.append('email', formData.email);
      formPayload.append('password', formData.password);
      formPayload.append('role', userType);

      if (userType === 'patient') {
        // Add patient fields
        formPayload.append('fullName', formData.fullName);
        formPayload.append('age', formData.age);
        formPayload.append('gender', formData.gender || 'Male');
        formPayload.append('contactNumber', formData.contactNumber);
        formPayload.append('address', formData.address);
        formPayload.append('bloodGroup', formData.bloodGroup || 'Unknown');
        // Add government ID if provided
        if (formData.governmentId) {
          formPayload.append('governmentId', formData.governmentId);
        }
        // Add emergency contact if provided
        if (formData.emergencyName || formData.emergencyPhone) {
          formPayload.append('emergencyContact', JSON.stringify({
            name: formData.emergencyName || '',
            relation: formData.emergencyRelation || '',
            phone: formData.emergencyPhone || ''
          }));
        }
      } else if (userType === 'admin') {
        // Add admin fields
        formPayload.append('name', formData.name);
        formPayload.append('adminId', formData.adminId);
        formPayload.append('secretKey', formData.secretKey);
        formPayload.append('contactNumber', formData.contactNumber);
      } else if (userType === 'doctor') {
        // Add doctor fields
        formPayload.append('name', formData.name);
        formPayload.append('specialization', formData.specialization);
        formPayload.append('hospitalName', formData.hospitalName);
        formPayload.append('registrationNumber', formData.registrationNumber);
        formPayload.append('contactNumber', formData.contactNumber);
        // Add medical license
        if (formData.medicalLicense) {
          formPayload.append('medicalLicense', formData.medicalLicense);
        }
        
        // Ensure isVerified is set to false for doctors
        formPayload.append('isVerified', 'false');
      }
      
      console.log('Sending registration data:', {
        email: formData.email,
        role: userType,
        ...(userType === 'patient' 
          ? { fullName: formData.fullName, age: formData.age } 
          : { name: formData.name, specialization: formData.specialization })
      });
      
      const response = await api.post('/auth/register', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        if (userType === 'doctor') {
          setSuccessMessage('Registration successful! Your account is pending approval from admin. You will be notified once approved.');
          setTimeout(() => navigate('/login'), 5000);
        } else if (userType === 'admin') {
          setSuccessMessage('Admin registration successful! You can login now.');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          login(response.data.token);
          navigate('/patient-dashboard');
        }

      } else {
        // Handle success:false case
        setErrors({ 
          submit: response.data.message || response.data.error || 'Registration failed. Please try again.'
        });
        setDebugInfo({
          response: response.data,
          status: response.status
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Detailed error handling
      if (error.response) {
        // Server responded with error
        setErrors({ 
          submit: error.response.data?.error || error.response.data?.message || 'Registration failed. Please try again.'
        });
        setDebugInfo({
          response: error.response.data,
          status: error.response.status
        });
      } else if (error.request) {
        // Request made but no response received
        setErrors({ 
          submit: 'No response from server. Please check your connection and try again.'
        });
        setDebugInfo({
          request: 'No response received',
          error: error.message
        });
      } else {
        // Error setting up request
        setErrors({ 
          submit: 'Error setting up request: ' + error.message
        });
        setDebugInfo({
          message: error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="card-header">
          <h2>Create New Account</h2>
          <p>Join our healthcare platform to manage medical records efficiently</p>
          
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
        </div>
        
        <div className="user-type-toggle">
          <button
            type="button"
            className={userType === 'patient' ? 'active' : ''}
            onClick={() => setUserType('patient')}
          >
            Patient
          </button>
          <button
            type="button"
            className={userType === 'doctor' ? 'active' : ''}
            onClick={() => setUserType('doctor')}
          >
            Doctor
          </button>
          <button
            type="button"
            className={userType === 'admin' ? 'active' : ''}
            onClick={() => setUserType('admin')}
          >
            Admin
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Account Details</h3>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
            </div>
          </div>
            
          <div className="form-section">
            <h3>
              {userType === 'patient' 
                ? 'Patient Information' 
                : userType === 'doctor' 
                  ? 'Doctor Information' 
                  : 'Admin Information'}
            </h3>
            
            {userType === 'patient' ? (
              // Patient Form
              <>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={errors.fullName ? 'input-error' : ''}
                  />
                  {errors.fullName && <p className="error-text">{errors.fullName}</p>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="age">Age *</label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className={errors.age ? 'input-error' : ''}
                    />
                    {errors.age && <p className="error-text">{errors.age}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="gender">Gender *</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number *</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={errors.contactNumber ? 'input-error' : ''}
                  />
                  {errors.contactNumber && <p className="error-text">{errors.contactNumber}</p>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'input-error' : ''}
                  />
                  {errors.address && <p className="error-text">{errors.address}</p>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="governmentId">Government ID (Optional)</label>
                  <input
                    type="file"
                    id="governmentId"
                    name="governmentId"
                    onChange={handleFileChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bloodGroup">Blood Group</label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                
                <div className="form-section">
                  <h3>Emergency Contact (Optional)</h3>
                  <div className="form-group">
                    <label htmlFor="emergencyName">Name</label>
                    <input
                      type="text"
                      id="emergencyName"
                      name="emergencyName"
                      value={formData.emergencyName}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="emergencyRelation">Relation</label>
                    <input
                      type="text"
                      id="emergencyRelation"
                      name="emergencyRelation"
                      value={formData.emergencyRelation}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="emergencyPhone">Phone</label>
                    <input
                      type="tel"
                      id="emergencyPhone"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            ) : userType === 'admin' ? (
              // Admin Form
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'input-error' : ''}
                  />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="adminId">Admin ID *</label>
                  <input
                    type="text"
                    id="adminId"
                    name="adminId"
                    value={formData.adminId}
                    onChange={handleChange}
                    className={errors.adminId ? 'input-error' : ''}
                  />
                  {errors.adminId && <p className="error-text">{errors.adminId}</p>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="secretKey">Secret Key *</label>
                  <input
                    type="password"
                    id="secretKey"
                    name="secretKey"
                    value={formData.secretKey}
                    onChange={handleChange}
                    className={errors.secretKey ? 'input-error' : ''}
                  />
                  {errors.secretKey && <p className="error-text">{errors.secretKey}</p>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number *</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={errors.contactNumber ? 'input-error' : ''}
                  />
                  {errors.contactNumber && <p className="error-text">{errors.contactNumber}</p>}
                </div>
              </>
            ) : (
              // Doctor Form
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'input-error' : ''}
                  />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="specialization">Specialization *</label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className={errors.specialization ? 'input-error' : ''}
                  />
                  {errors.specialization && <p className="error-text">{errors.specialization}</p>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="hospitalName">Hospital Name *</label>
                  <input
                    type="text"
                    id="hospitalName"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    className={errors.hospitalName ? 'input-error' : ''}
                  />
                  {errors.hospitalName && <p className="error-text">{errors.hospitalName}</p>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="registrationNumber">Registration Number *</label>
                    <input
                      type="text"
                      id="registrationNumber"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      className={errors.registrationNumber ? 'input-error' : ''}
                    />
                    {errors.registrationNumber && <p className="error-text">{errors.registrationNumber}</p>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="contactNumber">Contact Number *</label>
                    <input
                      type="tel"
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className={errors.contactNumber ? 'input-error' : ''}
                    />
                    {errors.contactNumber && <p className="error-text">{errors.contactNumber}</p>}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="medicalLicense">Medical License * (Upload proof)</label>
                  <input
                    type="file"
                    id="medicalLicense"
                    name="medicalLicense"
                    onChange={handleFileChange}
                    className={errors.medicalLicense ? 'input-error' : ''}
                  />
                  {errors.medicalLicense && <p className="error-text">{errors.medicalLicense}</p>}
                </div>
              </>
            )}
          </div>

          {errors.submit && (
            <div className="error-text submit-error">
              <p>{errors.submit}</p>
            </div>
          )}

          {debugInfo && (
            <div className="debug-info">
              <h4>Debug Information:</h4>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
            <p className="login-link">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
