import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css'; // We'll create this file for the specific landing page styles

const LandingPage = () => {
  const { currentUser, userRole } = useAuth();

  const renderDashboardLink = () => {
    if (!currentUser) return null;

    let dashboardUrl = '/';
    if (userRole === 'patient') dashboardUrl = '/patient-dashboard';
    else if (userRole === 'doctor') dashboardUrl = '/doctor-dashboard';
    else if (userRole === 'admin') dashboardUrl = '/admin-panel';

    return (
      <div className="cta-buttons">
        <Link to={dashboardUrl} className="btn btn-primary">
          Go to Dashboard
        </Link>
        <Link to="/register" className="btn btn-primary">
          Get Started
        </Link>
      </div>
    );
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header>
        <div className="container">
          <nav>
            <div className="logo">
              <span className="logo-icon">➕</span>
              MediCard+
            </div>
            <ul className="nav-links">
              <li><a href="#">Home</a></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Features</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
            <div className="cta-buttons">
        <Link to="/login" className="btn btn-primary">
          login
        </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Unifying Medical Records for Better Healthcare</h1>
          <p>MediCard+ provides a secure, digital solution to store and access medical records, promoting better
            coordination between patients, doctors, and pharmacies.</p>
          <div className="cta-buttons">
            {!currentUser ? (
              <>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
                <Link to="#features" className="btn btn-outline" style={{ backgroundColor: 'transparent', color: 'white', borderColor: 'white' }}>Learn More</Link>
              </>
            ) : (
              renderDashboardLink()
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-title">
            <h2>Our Objectives</h2>
            <p>MediCard+ aims to revolutionize how medical records are stored, accessed, and utilized.</p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Storage</h3>
              <p>End-to-end encrypted storage of sensitive medical information with role-based access control.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Seamless Sharing</h3>
              <p>Easily share medical records between authorized healthcare providers with patient consent.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Digital ID Card</h3>
              <p>Carry your medical information securely with a digital ID card accessible from any device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="audience">
        <div className="container">
          <div className="section-title">
            <h2>Who Benefits from MediCard+</h2>
            <p>Our platform serves multiple stakeholders in the healthcare ecosystem.</p>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-icon" style={{ color: '#3498db' }}>👨‍👩‍👧‍👦</div>
              <h3>Patients</h3>
              <p>Access your complete medical history, share records securely, and receive personalized health insights.</p>
            </div>
            <div className="audience-card">
              <div className="audience-icon" style={{ color: '#e74c3c' }}>👩‍⚕️</div>
              <h3>Doctors</h3>
              <p>Make informed decisions with complete patient history and collaborate seamlessly with specialists.</p>
            </div>
            <div className="audience-card">
              <div className="audience-icon" style={{ color: '#2ecc71' }}>💊</div>
              <h3>Pharmacies</h3>
              <p>Verify prescriptions instantly, check for medication interactions, and maintain accurate records.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h4>MediCard+</h4>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Our Team</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">News & Updates</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">User Guides</a></li>
                <li><a href="#">API Documentation</a></li>
                <li><a href="#">Partner Program</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul className="footer-links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Data Processing</a></li>
                <li><a href="#">HIPAA Compliance</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Contact Us</h4>
              <ul className="footer-links">
                <li><a href="mailto:info@medicard.plus">info@medicard.plus</a></li>
                <li><a href="tel:+11234567890">+1 (123) 456-7890</a></li>
                <li>123 Health Street</li>
                <li>Medical District, MD 12345</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 MediCard+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;