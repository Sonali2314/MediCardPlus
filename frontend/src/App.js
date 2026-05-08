import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import HomePage from './components/home/HomePage';
import DoctorDashboard from './components/Dashboard/doctor/DoctorDashboard';
import HospitalDashboard from './components/Dashboard/hospital/HospitalDashboard';
import PatientDashboard from './components/Dashboard/patient/PatientDashboard';

function AppRoutes({ currentUser, setCurrentUser }) {
  const navigate = useNavigate();

  function mapViewToPath(v) {
    if (!v) return '/';
    if (v.startsWith('/')) return v;
    switch (v) {
      case 'home': return '/';
      case 'login': return '/login';
      case 'signup': return '/signup';
      case 'forgot-password': return '/forgot-password';
      case 'reset-password': return '/reset-password';
      case 'doctor': return '/doctor';
      case 'hospital': return '/hospital';
      case 'patient': return '/patient';
      default: return '/';
    }
  }

  function handleNavigate(v, payload) {
    if (payload && payload.user) {
      setCurrentUser(payload.user);
      // Redirect to appropriate dashboard based on user type
      switch (payload.user.userType) {
        case 'doctor':
          v = 'doctor';
          break;
        case 'hospital':
          v = 'hospital';
          break;
        case 'patient':
          v = 'patient';
          break;
        default:
          v = '/';
          break;
      }
    }
    const path = mapViewToPath(v);
    navigate(path);
  }

  // Protected route wrapper
  const ProtectedRoute = ({ element, allowedUserType }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    if (currentUser.userType !== allowedUserType) {
      return <Navigate to="/" replace />;
    }
    return element;
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
      <Route path="/login" element={<LoginPage onNavigate={handleNavigate} />} />
      <Route path="/signup" element={<SignupPage onNavigate={handleNavigate} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />
      <Route path="/reset-password" element={<ResetPasswordPage onNavigate={handleNavigate} />} />
      <Route path="/doctor" element={
        <ProtectedRoute 
          allowedUserType="doctor" 
          element={<DoctorDashboard doctor={currentUser} />} 
        />
      } />
      <Route path="/hospital" element={
        <ProtectedRoute 
          allowedUserType="hospital" 
          element={<HospitalDashboard hospital={currentUser} />} 
        />
      } />
      <Route path="/patient" element={
        <ProtectedRoute 
          allowedUserType="patient" 
          element={<PatientDashboard patient={currentUser} />} 
        />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <BrowserRouter>
      <AppRoutes currentUser={currentUser} setCurrentUser={setCurrentUser} />
    </BrowserRouter>
  );
}

export default App;