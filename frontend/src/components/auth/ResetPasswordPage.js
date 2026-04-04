import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './LoginPage.css';

function ResetPasswordPage({ onNavigate }) {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');

  const [token, setToken] = useState(urlToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(!urlToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    setErrors({});

    if (!token) {
      newErrors.token = 'Reset token is required';
    }
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    }
    if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Password reset successfully!');
        setTimeout(() => {
          if (onNavigate) onNavigate('login');
        }, 2000);
      } else {
        setErrors({ form: data.message || 'Error resetting password' });
      }
    } catch (err) {
      setErrors({ form: 'Network error. Please try again.' });
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>Password Reset Successful</h1>
            <p>Your password has been updated</p>
          </div>

          <div className="form-section">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
              <p style={{ color: '#10b981', marginBottom: '10px' }}>{success}</p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <button 
            className="back-btn" 
            onClick={() => onNavigate && onNavigate('login')}
          >
            <i className="fas fa-arrow-left"></i> Back to Login
          </button>
          <h1>Create New Password</h1>
          <p>Set a new password for your account</p>
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

        {/* Reset Password Form */}
        <div className="form-section">
          {/* Token Input - Show only if no URL token */}
          {showTokenInput && (
            <div className="form-group">
              <label>Reset Token (from terminal/email)</label>
              <input
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setErrors({ ...errors, token: '' });
                }}
                placeholder="Paste your reset token here"
                className={errors.token ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.token && <span className="error-text">{errors.token}</span>}
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Check your backend terminal for the reset token during development
              </p>
            </div>
          )}

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors({ ...errors, newPassword: '' });
              }}
              placeholder="••••••••"
              className={errors.newPassword ? 'input-error' : ''}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: '' });
              }}
              placeholder="••••••••"
              className={errors.confirmPassword ? 'input-error' : ''}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          {errors.form && <div className="form-error">{errors.form}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;
