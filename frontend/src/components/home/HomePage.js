import React from 'react';
import './HomePage.css';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';

function HomePage({ onNavigate }) {
  const [featuresRef, isFeaturesVisible] = useIntersectionObserver();
  const [benefitsRef, isBenefitsVisible] = useIntersectionObserver();
  const [testimonialRef, isTestimonialVisible] = useIntersectionObserver();
  const [ctaRef, isCtaVisible] = useIntersectionObserver();
  return (
    <div className="home-root">
      <header className="home-header">
        <div className="home-brand">
          <i className="fas fa-heartbeat brand-icon"></i>
          Medicard+
        </div>
        <nav className="header-nav">
          <a href="#features" className="nav-link">Features</a>
          <a href="#benefits" className="nav-link">Benefits</a>
          <a href="#testimonials" className="nav-link">Testimonials</a>
          <button className="nav-btn" onClick={() => onNavigate && onNavigate('login')}>
            <i className="fas fa-sign-in-alt"></i> Sign in
          </button>
          <button className="nav-btn primary" onClick={() => onNavigate && onNavigate('signup')}>
            <i className="fas fa-user-plus"></i> Sign up
          </button>
        </nav>
      </header>

      <main className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-shield-alt"></i>
            Trusted by 1000+ Healthcare Providers
          </div>
          <h1>Your Health Journey,<br />Digitally Transformed</h1>
          <p>Experience healthcare management reimagined with Medicard+. Our secure platform connects patients, doctors, and hospitals in one seamless ecosystem.</p>
          <div className="hero-ctas">
            <button className="cta pulse" onClick={() => onNavigate && onNavigate('signup')}>
              <i className="fas fa-rocket"></i>
              Get Started Free
            </button>
            <button className="cta ghost" onClick={() => onNavigate && onNavigate('login')}>
              <i className="fas fa-play"></i>
              Watch Demo
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Support</span>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="hero-image">
            <div className="floating-card card-1">
              <i className="fas fa-calendar-check"></i>
              <span>Easy Scheduling</span>
            </div>
            <div className="floating-card card-2">
              <i className="fas fa-notes-medical"></i>
              <span>Digital Records</span>
            </div>
            <div className="floating-card card-3">
              <i className="fas fa-mobile-alt"></i>
              <span>Mobile Access</span>
            </div>
          </div>
        </div>
      </main>

      <section id="features" className={`features ${isFeaturesVisible ? 'fade-in visible' : 'fade-in'}`} ref={featuresRef}>
        <div className="section-header">
          <h2>One Platform, Complete Healthcare Solution</h2>
          <p>Discover how Medicard+ transforms healthcare management for everyone</p>
        </div>
        
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon-wrapper">
              <i className="fas fa-user-md feature-icon"></i>
            </div>
            <h3>For Patients</h3>
            <p>Your complete health companion in one secure place.</p>
            <div className="feature-details">
              <ul>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Digital Health Records</strong>
                    <span>Access your complete medical history anytime, anywhere</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Easy Appointments</strong>
                    <span>Book and manage appointments with just a few clicks</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Prescription Tracking</strong>
                    <span>Never miss a medication with smart reminders</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Direct Communication</strong>
                    <span>Secure messaging with your healthcare providers</span>
                  </div>
                </li>
              </ul>
            </div>
            <button className="feature-cta" onClick={() => onNavigate && onNavigate('signup')}>
              Get Started as Patient
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          <div className="feature">
            <div className="feature-icon-wrapper">
              <i className="fas fa-stethoscope feature-icon"></i>
            </div>
            <h3>For Doctors</h3>
            <p>Streamline your practice with powerful tools.</p>
            <div className="feature-details">
              <ul>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Patient Management</strong>
                    <span>Comprehensive dashboard for patient care</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Digital Prescriptions</strong>
                    <span>Write and manage prescriptions digitally</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Smart Scheduling</strong>
                    <span>Efficient appointment management system</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Medical History</strong>
                    <span>Quick access to patient records and history</span>
                  </div>
                </li>
              </ul>
            </div>
            <button className="feature-cta" onClick={() => onNavigate && onNavigate('signup')}>
              Join as Doctor
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>

          <div className="feature">
            <div className="feature-icon-wrapper">
              <i className="fas fa-hospital feature-icon"></i>
            </div>
            <h3>For Hospitals</h3>
            <p>Transform your hospital management system.</p>
            <div className="feature-details">
              <ul>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Staff Coordination</strong>
                    <span>Efficient staff and department management</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Resource Planning</strong>
                    <span>Optimize resource allocation and tracking</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Patient Tracking</strong>
                    <span>Real-time monitoring of patient flow</span>
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Analytics Dashboard</strong>
                    <span>Comprehensive reporting and insights</span>
                  </div>
                </li>
              </ul>
            </div>
            <button className="feature-cta" onClick={() => onNavigate && onNavigate('signup')}>
              Register Hospital
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      <section id="benefits" className={`benefits ${isBenefitsVisible ? 'fade-in visible' : 'fade-in'}`} ref={benefitsRef}>
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-star"></i>
            Why Choose Us
          </div>
          <h2>The Medicard+ Advantage</h2>
          <p>Experience healthcare management like never before with our cutting-edge features</p>
        </div>
        
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h4>Enterprise-Grade Security</h4>
            <p>Bank-level encryption and compliance with healthcare data protection standards</p>
            <ul className="benefit-features">
              <li>End-to-end encryption</li>
              <li>HIPAA compliant</li>
              <li>Regular security audits</li>
            </ul>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="fas fa-bolt"></i>
            </div>
            <h4>Lightning Fast Access</h4>
            <p>Retrieve medical records and book appointments in seconds, not minutes</p>
            <ul className="benefit-features">
              <li>Instant data retrieval</li>
              <li>Quick appointment booking</li>
              <li>Real-time updates</li>
            </ul>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="fas fa-mobile-alt"></i>
            </div>
            <h4>Seamless Accessibility</h4>
            <p>Access your healthcare information from any device, anywhere in the world</p>
            <ul className="benefit-features">
              <li>Mobile-first design</li>
              <li>Cross-platform support</li>
              <li>Offline access capability</li>
            </ul>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">
              <i className="fas fa-sync"></i>
            </div>
            <h4>Smart Integration</h4>
            <p>Seamlessly connect with various healthcare systems and providers</p>
            <ul className="benefit-features">
              <li>API integration support</li>
              <li>Automated synchronization</li>
              <li>Universal compatibility</li>
            </ul>
          </div>
        </div>
        
        <div className="benefits-cta">
          <div className="benefits-cta-content">
            <h3>Ready to Experience the Difference?</h3>
            <p>Join thousands of healthcare providers and patients who trust Medicard+</p>
          </div>
          <button className="cta pulse" onClick={() => onNavigate && onNavigate('signup')}>
            Start Your Journey
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </section>

      <section className={`testimonials ${isTestimonialVisible ? 'fade-in visible' : 'fade-in'}`} ref={testimonialRef}>
        <h2>Trusted by Healthcare Professionals</h2>
        <div className="testimonial-grid">
          <div className="testimonial">
            <p>"Medicard+ has transformed how we manage patient care. It's intuitive and efficient."</p>
            <div className="testimonial-author">
              <i className="fas fa-user-md"></i>
              <div>
                <strong>Dr. Sarah Johnson</strong>
                <span>Cardiologist</span>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <p>"The platform has streamlined our hospital operations significantly."</p>
            <div className="testimonial-author">
              <i className="fas fa-hospital-user"></i>
              <div>
                <strong>Mark Stevens</strong>
                <span>Hospital Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`home-cta ${isCtaVisible ? 'fade-in visible' : 'fade-in'}`} ref={ctaRef}>
        <h2>Ready to get started?</h2>
        <p>Join thousands of healthcare professionals and patients who trust Medicard+</p>
        <button className="cta large" onClick={() => onNavigate && onNavigate('signup')}>
          Create your free account
          <i className="fas fa-arrow-right"></i>
        </button>
      </section>

      <footer className="home-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="home-brand">Medicard+</div>
            <p>Modern healthcare management</p>
          </div>
          <div className="footer-links">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#careers">Careers</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-social">
            <h4>Connect</h4>
            <div className="social-icons">
              <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noreferrer"><i className="fab fa-twitter"></i></a>
              <a href="https://www.linkedin.com" aria-label="LinkedIn" target="_blank" rel="noreferrer"><i className="fab fa-linkedin"></i></a>
              <a href="https://github.com" aria-label="GitHub" target="_blank" rel="noreferrer"><i className="fab fa-github"></i></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <small>&copy; {new Date().getFullYear()} Medicard+. All rights reserved.</small>
          <div className="footer-legal">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
