// LoginPage.js
import { useState } from 'react';
import './LoginPage.css';
import authService from '../../services/authService';

function LoginPage({ onNavigate }) {
  const [userType, setUserType] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email or User ID is required';
    } else {
      if (email.includes('@')) {
        if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  // Modified handleSubmit to ensure correct dashboard navigation by matching case and keys
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await authService.login(email, password, userType);

        if (!response.ok) {
          setErrors({ form: response.message });
          setIsLoading(false);
          return;
        }

        const { user, token } = response;

        // Store user data and token
        localStorage.setItem('token', token);
        localStorage.setItem('userType', user.userType);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('user', JSON.stringify({ ...user, id: user.id }));

        // Navigate to correct dashboard route (matches App.js route keys)
        if (onNavigate) {
          const routeKey = user.userType?.toLowerCase();
          if (routeKey && ['doctor', 'patient', 'hospital'].includes(routeKey)) {
            onNavigate(routeKey, { user });
          } else {
            onNavigate('home', { user });
          }
        }
      } catch (error) {
        setErrors({ form: 'Login failed. Please try again.' });
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
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {/* User Type Selection */}
        <div className="user-type-section">
          <label>Select User Type</label>
          <div className="user-type-buttons">
            <button
              onClick={() => setUserType('patient')}
              className={userType === 'patient' ? 'user-btn active' : 'user-btn'}
            >
              👤 Patient
            </button>
            <button
              onClick={() => setUserType('doctor')}
              className={userType === 'doctor' ? 'user-btn active' : 'user-btn'}
            >
              ⚕️ Doctor
            </button>
            <button
              onClick={() => setUserType('hospital')}
              className={userType === 'hospital' ? 'user-btn active' : 'user-btn'}
            >
              🏥 Hospital
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="form-section">
          <div className="form-group">
            <label>Email address or User ID</label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: '' });
              }}
              placeholder="you@example.com or MC-..."
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: '' });
              }}
              placeholder="••••••••"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button className="forgot-password">Forgot password?</button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="submit-btn"
          >
            {isLoading ? 'Signing in...' : `Sign In as ${userType}`}
          </button>
          {errors.form && <div className="form-error">{errors.form}</div>}
        </div>

        <div className="signup-section">
          <p>Don't have an account? <button className="signup-link" onClick={() => onNavigate && onNavigate('signup')}>Sign up</button></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;