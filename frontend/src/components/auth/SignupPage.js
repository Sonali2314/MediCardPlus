import { useState } from 'react';
import './SignupPage.css';
import authService from '../../services/authService';

function SignupPage({ onNavigate }) {
  const [userType, setUserType] = useState('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [extra, setExtra] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirm) newErrors.confirm = 'Passwords do not match';
    if (!phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^\d{10}$/.test(phoneNumber)) newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';

    // Address validation
    if (!address.street) newErrors.street = 'Street address is required';
    if (!address.city) newErrors.city = 'City is required';
    if (!address.state) newErrors.state = 'State is required';
    if (!address.zipCode) newErrors.zipCode = 'ZIP code is required';
    
    // Role-specific validation
    if (userType === 'patient') {
      if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!gender) newErrors.gender = 'Gender is required';
    } else if (userType === 'hospital') {
      if (!hospitalType) newErrors.hospitalType = 'Hospital type is required';
    }
    
    return newErrors;
  };

  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [hospitalType, setHospitalType] = useState('private');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        let userData = {
          userType,
          fullName,
          email,
          password,
          phoneNumber
        };

        // Add type-specific fields
        if (userType === 'patient') {
          userData = {
            ...userData,
            dateOfBirth,
            gender,
            address
          };
        } else if (userType === 'hospital') {
          userData = {
            ...userData,
            registrationNumber: `HOSP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: hospitalType,
            address,
            facilities: [],
            departments: []
          };
        }

        const res = await authService.createUser(userData);
        if (!res.ok) {
          setErrors({ form: res.message });
          return;
        }
        alert('Account created successfully!');
        if (onNavigate) onNavigate('login');
      } catch (error) {
        setErrors({ form: error.message || 'Failed to create account' });
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Create Account</h1>
          <p>Register a new account</p>
        </div>

        <div className="user-type-section">
          <label>Select User Type</label>
          <div className="user-type-buttons">
            <button onClick={() => setUserType('patient')} className={userType === 'patient' ? 'user-btn active' : 'user-btn'}>👤 Patient</button>
            <button onClick={() => setUserType('hospital')} className={userType === 'hospital' ? 'user-btn active' : 'user-btn'}>🏥 Hospital</button>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label>Full Name</label>
            <input value={fullName} onChange={(e)=>{ setFullName(e.target.value); setErrors({...errors, fullName: ''}); }} placeholder="Your full name" className={errors.fullName ? 'input-error' : ''} />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e)=>{ setEmail(e.target.value); setErrors({...errors, email: ''}); }} placeholder="you@example.com" className={errors.email ? 'input-error' : ''} />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e)=>{ setPassword(e.target.value); setErrors({...errors, password: ''}); }} placeholder="••••••••" className={errors.password ? 'input-error' : ''} />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirm} onChange={(e)=>{ setConfirm(e.target.value); setErrors({...errors, confirm: ''}); }} placeholder="••••••••" className={errors.confirm ? 'input-error' : ''} />
            {errors.confirm && <span className="error-text">{errors.confirm}</span>}
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Your phone number"
            />
          </div>

          {/* Address Fields for all users */}
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder="Street Address"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="City"
              />
              <input
                type="text"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                placeholder="State"
              />
            </div>
            <input
              type="text"
              value={address.zipCode}
              onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
              placeholder="ZIP Code"
            />
          </div>

          {/* Patient-specific fields */}
          {userType === 'patient' && (
            <>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          {/* Hospital-specific fields */}
          {userType === 'hospital' && (
            <div className="form-group">
              <label>Hospital Type</label>
              <select
                value={hospitalType}
                onChange={(e) => setHospitalType(e.target.value)}
              >
                <option value="private">Private</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <button onClick={handleSubmit} disabled={isLoading} className="submit-btn">{isLoading ? 'Creating...' : `Create account as ${userType}`}</button>
        </div>

        <div className="signup-section">
          <p>Already have an account? <button className="signup-link" onClick={() => onNavigate && onNavigate('login')}>Sign in</button></p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
