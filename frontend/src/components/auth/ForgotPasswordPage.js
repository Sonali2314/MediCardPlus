import React, { useState } from 'react';
import './LoginPage.css';

function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Check your email for password reset instructions.');
        setEmail('');
        setSubmitted(true);
      } else {
        setError(data.message || 'Error sending reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  if (submitted && success) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <button className="back-btn" onClick={() => onNavigate && onNavigate('login')}>
              <i className="fas fa-arrow-left"></i> Back to Login
            </button>
            <h1>Email Sent</h1>
            <p>Check your inbox for reset instructions</p>
          </div>

          <div className="form-section">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
              <p style={{ color: '#10b981', marginBottom: '10px' }}>{success}</p>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                The reset link will expire in 1 hour.
              </p>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('login')}
              className="submit-btn"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <button className="back-btn" onClick={() => onNavigate && onNavigate('login')}>
            <i className="fas fa-arrow-left"></i> Back to Login
          </button>
          <h1>Reset Your Password</h1>
          <p>Enter your email address and we'll send you a reset link</p>
        </div>

        {/* User Type Selection */}
        <div className="user-type-section">
          <label>Select User Type</label>
          <div className="user-type-buttons">
            <button
              onClick={() => {
                setUserType('patient');
                setError('');
              }}
              className={userType === 'patient' ? 'user-btn active' : 'user-btn'}
            >
              👤 Patient
            </button>
            <button
              onClick={() => {
                setUserType('doctor');
                setError('');
              }}
              className={userType === 'doctor' ? 'user-btn active' : 'user-btn'}
            >
              ⚕️ Doctor
            </button>
            <button
              onClick={() => {
                setUserType('hospital');
                setError('');
              }}
              className={userType === 'hospital' ? 'user-btn active' : 'user-btn'}
            >
              🏥 Hospital
            </button>
          </div>
        </div>

        {/* Forgot Password Form */}
        <div className="form-section">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="you@example.com"
              className={error ? 'input-error' : ''}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            {error && <span className="error-text">{error}</span>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        <div className="signup-section">
          <p>
            Remember your password?{' '}
            <button 
              className="signup-link" 
              onClick={() => onNavigate && onNavigate('login')}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
