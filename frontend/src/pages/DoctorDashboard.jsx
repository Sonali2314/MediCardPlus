import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import './DoctorDashboard.css';

const POLL_INTERVAL = 10000; // 10 seconds for polling real-time data

const sidebarLinks = [
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'Patients', key: 'patients' },
  { label: 'Appointments', key: 'appointments' },
  { label: 'Medical Records', key: 'medicalRecords' },
  { label: 'Prescriptions', key: 'prescriptions' },
  { label: 'Lab Results', key: 'labResults' },
  { label: 'Settings', key: 'settings' },
];

const DoctorDashboard = () => {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    appointments: [],
    schedule: [],
    recentActivity: [],
  });
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescription, setPrescription] = useState({
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: '',
    notes: ''
  });
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        if (!currentUser) {
          navigate('/login');
          return;
        }
        if (userRole !== 'doctor') {
          navigate('/');
          return;
        }
        // Fetch doctor profile
        try {
          const res = await api.get('/doctors/profile');
          setDoctorProfile(res.data.data);
        } catch (err) {
          setDoctorProfile(null);
        }
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [currentUser, userRole, loading, navigate]);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        // Use doctor-specific search endpoint
        const res = await api.get(`/doctors/patients/search?query=${encodeURIComponent(query)}`);
        if (res.data && Array.isArray(res.data.data)) {
          setSuggestions(res.data.data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    },
    []
  );

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    debouncedSearch(value);
  };

  // Handle suggestion click
  const handleSuggestionClick = async (patient) => {
    setSearchQuery(patient.fullName);
    setShowSuggestions(false);
    setError(null);
    await fetchPatientDetails(patient.patientId);
  };

  // Back to search handler
  const handleBackToSearch = () => {
    setSelectedPatient(null);
    setError(null);
  };

  // Fetch detailed patient information (profile, history, prescriptions)
  const fetchPatientDetails = async (patientId) => {
    try {
      setIsSearching(true);
      setError(null);
      // Use doctor-specific endpoint
      const res = await api.get(`/doctors/patients/${patientId}`);
      console.log('Patient details API response:', res.data);
      if (res.data && res.data.data) {
        const { patient, medicalRecords, allergies } = res.data.data;
        setSelectedPatient({ ...patient, allergies });
        // Fetch history and prescriptions if not included
        setPatientHistory(medicalRecords || []);
        // Fetch prescriptions (if not included)
        try {
          const prescriptionsRes = await api.get(`/api/patients/${patient._id}/prescriptions`);
          setPatientPrescriptions(prescriptionsRes.data || []);
        } catch (err) {
          setPatientPrescriptions([]);
        }
      } else {
        setSelectedPatient(null);
        setPatientHistory([]);
        setPatientPrescriptions([]);
        setError('No patient details found for this ID.');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error, error?.response?.data);
      setError('Failed to fetch patient details. ' + (error?.response?.data?.error || ''));
      setSelectedPatient(null);
      setPatientHistory([]);
      setPatientPrescriptions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Update search results to use doctor endpoint and show 'No results found'
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setError(null);
      // Use doctor-specific search endpoint
      const res = await api.get(`/doctors/patients/search?query=${encodeURIComponent(searchQuery)}`);
      console.log('Search API response:', res.data);
      if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        console.log('Search results:', res.data.data); // Debug log
        setSearchResults(res.data.data);
        setShowSuggestions(false);
        if (res.data.data.length === 1) {
          await handleSuggestionClick(res.data.data[0]);
        }
      } else {
        setSearchResults([]);
        setError('No patients found matching your search.');
      }
    } catch (error) {
      console.error('Error searching patients:', error, error?.response?.data);
      setError('Failed to search patients. Please try again. ' + (error?.response?.data?.error || ''));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleScanQR = () => {
    // In a real app, this would trigger the camera for QR scanning
    alert('QR scanner functionality would be implemented here');
  };

  const handleDownloadHealthCard = async (patientId) => {
    try {
      setError(null);
      const response = await api.get(`/api/patients/${patientId}/health-card`, {
        responseType: 'blob'
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `health-card-${patientId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading health card:', error);
      setError('Failed to download health card. Please try again.');
    }
  };

  // New functions for prescription handling
  const handleAddMedication = () => {
    setPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const handleRemoveMedication = (index) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      setError(null);
      const response = await api.post(`/api/patients/${selectedPatient._id}/prescriptions`, {
        ...prescription,
        doctorId: currentUser._id,
        doctorName: currentUser.name,
        date: new Date().toISOString()
      });

      if (response.data) {
        setPatientPrescriptions(prev => [...prev, response.data]);
        setShowPrescriptionForm(false);
        setPrescription({
          medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
          instructions: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      setError('Failed to save prescription. Please try again.');
    }
  };

  // Polling for dashboard data
  useEffect(() => {
    let poller;
    const fetchDashboard = async () => {
      try {
        setIsPolling(true);
        // Replace with real API endpoints
        // Example: const res = await api.get('/api/doctor/dashboard');
        // setDashboardData(res.data);
        // For now, use mock data:
        setDashboardData({
          summary: {
            appointments: { count: 12, diff: 2 },
            reports: { count: 4, diff: -2 },
            newPatients: { count: 8, diff: 3 },
            avgConsult: { time: 23, diff: 0 },
          },
          appointments: [
            { patient: 'Sarah Johnson', time: '09:00 AM', status: 'Checked in', type: 'Follow-up' },
            { patient: 'Michael Chen', time: '10:30 AM', status: 'Waiting', type: 'New Patient' },
            { patient: 'Robert Garcia', time: '11:45 AM', status: 'Delayed', type: 'Test Results' },
            { patient: 'Emily Wilson', time: '01:15 PM', status: 'Scheduled', type: 'Follow-up' },
            { patient: 'David Smith', time: '02:30 PM', status: 'Scheduled', type: 'Consultation' },
          ],
          schedule: [
            { time: '08:30 AM', event: 'Morning Rounds', location: 'Ward 3, Floor 2' },
            { time: '09:00 AM', event: 'Patient: Sarah Johnson', desc: 'Follow-up Appointment' },
            { time: '10:30 AM', event: 'Patient: Michael Chen', desc: 'New Patient Consultation' },
            { time: '12:00 PM', event: 'Lunch Break', location: 'Staff Cafeteria' },
            { time: '01:00 PM', event: 'Department Meeting', location: 'Conference Room B' },
            { time: '02:30 PM', event: 'Patient: David Smith', desc: 'Consultation' },
          ],
          recentActivity: [
            { patient: 'James Wilson', date: 'Apr 02, 2025', activity: 'Prescription Refill', status: 'Pending' },
            { patient: 'Maria Rodriguez', date: 'Apr 02, 2025', activity: 'Lab Results', status: 'Completed' },
            { patient: 'Thomas Lee', date: 'Apr 01, 2025', activity: 'Follow-up Appointment', status: 'Completed' },
          ],
        });
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
      } finally {
        setIsPolling(false);
      }
    };
    fetchDashboard();
    poller = setInterval(fetchDashboard, POLL_INTERVAL);
    return () => clearInterval(poller);
  }, []);

  // Sidebar navigation handler
  const handleSidebarClick = (key) => setActiveSection(key);

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="dashboard-summary-cards">
      <div className="summary-card">
        <div className="summary-title">Today's Appointments</div>
        <div className="summary-value">{dashboardData.summary.appointments?.count ?? '--'}</div>
        <div className="summary-diff positive">+{dashboardData.summary.appointments?.diff ?? 0} from yesterday</div>
      </div>
      <div className="summary-card">
        <div className="summary-title">Pending Reports</div>
        <div className="summary-value">{dashboardData.summary.reports?.count ?? '--'}</div>
        <div className="summary-diff negative">{dashboardData.summary.reports?.diff ?? 0} from yesterday</div>
      </div>
      <div className="summary-card">
        <div className="summary-title">New Patients</div>
        <div className="summary-value">{dashboardData.summary.newPatients?.count ?? '--'}</div>
        <div className="summary-diff positive">+{dashboardData.summary.newPatients?.diff ?? 0} from last week</div>
      </div>
      <div className="summary-card">
        <div className="summary-title">Average Consult Time</div>
        <div className="summary-value">{dashboardData.summary.avgConsult?.time ?? '--'}m</div>
        <div className="summary-diff neutral">Same as last week</div>
      </div>
    </div>
  );

  // Render main dashboard content
  const renderDashboardMain = () => (
    <div className="dashboard-main-content">
      <div className="dashboard-main-top">
        <div className="appointments-table">
          <div className="table-header">
            <span>Today's Appointments</span>
            <a href="#" className="view-all-link">View all</a>
          </div>
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Time</th>
                <th>Status</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.appointments.map((appt, idx) => (
                <tr key={idx}>
                  <td>{appt.patient}</td>
                  <td>{appt.time}</td>
                  <td><span className={`status-badge status-${appt.status.replace(/\s/g, '').toLowerCase()}`}>{appt.status}</span></td>
                  <td>{appt.type}</td>
                  <td><a href="#" className="action-link">View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="schedule-panel">
          <div className="table-header">
            <span>Today's Schedule</span>
            <a href="#" className="view-all-link">View calendar</a>
          </div>
          <ul className="schedule-list">
            {dashboardData.schedule.map((item, idx) => (
              <li key={idx}>
                <span className="schedule-time">{item.time}</span>
                <span className="schedule-event">{item.event}</span>
                {item.desc && <span className="schedule-desc">{item.desc}</span>}
                {item.location && <span className="schedule-location">{item.location}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="recent-activity-table">
        <div className="table-header">
          <span>Recent Patient Activity</span>
          <a href="#" className="view-all-link">View all</a>
        </div>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Activity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.recentActivity.map((act, idx) => (
              <tr key={idx}>
                <td>{act.patient}</td>
                <td>{act.date}</td>
                <td>{act.activity}</td>
                <td><span className={`status-badge status-${act.status.replace(/\s/g, '').toLowerCase()}`}>{act.status}</span></td>
                <td><a href="#" className="action-link">{act.status === 'Pending' ? 'Review' : act.status === 'Completed' ? 'View' : 'View Notes'}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render horizontal tab navigation
  const renderTabs = () => (
    <div className="main-tabs">
      {sidebarLinks.map(link => (
        <div
          key={link.key}
          className={`main-tab${activeSection === link.key ? ' active' : ''}`}
          onClick={() => handleSidebarClick(link.key)}
        >
          {link.label}
        </div>
      ))}
    </div>
  );

  const renderPatientsTab = () => (
    <div className="tab-content">
      <div className="patients-header">
        <h2>Patients</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, ID, or phone number..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button className="search-btn" onClick={handleSearch}>Search</button>
          <button className="scan-btn" onClick={handleScanQR}>
            <i className="fas fa-qrcode"></i> Scan QR
          </button>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-container">
          {suggestions.map((patient) => (
            <div
              key={patient.patientId}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(patient)}
            >
              <div className="patient-info">
                <span className="patient-name">{patient.fullName}</span>
                <span className="patient-id">ID: {patient.patientId}</span>
              </div>
              <span className="patient-contact">{patient.contactNumber}</span>
            </div>
          ))}
        </div>
      )}

      {selectedPatient ? (
        <div className="patient-dashboard">
          <div className="patient-header">
            <div className="patient-profile">
              <h3>{selectedPatient.fullName}</h3>
              <div className="patient-details">
                <div className="detail-item">
                  <span className="label">Patient ID:</span>
                  <span className="value">{selectedPatient.patientId}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Age:</span>
                  <span className="value">{selectedPatient.age}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Gender:</span>
                  <span className="value">{selectedPatient.gender}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Blood Group:</span>
                  <span className="value">{selectedPatient.bloodGroup}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Contact:</span>
                  <span className="value">{selectedPatient.contactNumber}</span>
                </div>
              </div>
            </div>
            <div className="patient-actions">
              <button className="action-btn view-btn" onClick={() => setActiveSection('medicalRecords')}>
                View Records
              </button>
              <button className="action-btn view-btn" onClick={() => setActiveSection('prescriptions')}>
                View Prescriptions
              </button>
              <button className="action-btn view-btn" onClick={() => setActiveSection('labResults')}>
                View Lab Results
              </button>
              <button className="action-btn download-btn" onClick={() => handleDownloadHealthCard(selectedPatient.patientId)}>
                Download Health Card
              </button>
            </div>
          </div>

          <div className="patient-summary">
            <div className="summary-section">
              <h4>Recent Medical History</h4>
              <div className="history-list">
                {patientHistory.slice(0, 3).map((record, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-date">{new Date(record.date).toLocaleDateString()}</div>
                    <div className="history-content">
                      <h5>{record.diagnosis}</h5>
                      <p>{record.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="summary-section">
              <h4>Allergies</h4>
              <div className="allergies-list">
                {selectedPatient.allergies?.length > 0 ? (
                  selectedPatient.allergies.map((allergy, idx) => (
                    <div key={idx} className="allergy-item">
                      <span className="allergy-name">{allergy.name}</span>
                      <span className="allergy-severity">{allergy.severity}</span>
                    </div>
                  ))
                ) : (
                  <p>No known allergies</p>
                )}
              </div>
            </div>

            <div className="summary-section">
              <h4>Recent Prescriptions</h4>
              <div className="prescriptions-list">
                {patientPrescriptions.slice(0, 3).map((prescription, idx) => (
                  <div key={idx} className="prescription-item">
                    <div className="prescription-date">
                      {new Date(prescription.date).toLocaleDateString()}
                    </div>
                    <div className="prescription-content">
                      <h5>Medications</h5>
                      <ul>
                        {prescription.medications.map((med, mIdx) => (
                          <li key={mIdx}>
                            {med.name} - {med.dosage} ({med.frequency})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="search-prompt">
          <p>Search for a patient to view their dashboard</p>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}
    </div>
  );

  const renderAppointmentsTab = () => (
    <div className="tab-content">
      <div className="appointments-header">
        <h2>Appointments</h2>
        <button className="new-appointment-btn" onClick={() => navigate('/appointments/new')}>
          Schedule New Appointment
        </button>
      </div>
      <div className="appointments-filters">
        <select className="filter-select">
          <option value="all">All Appointments</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select className="filter-select">
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="appointments-list">
        {dashboardData.appointments.map((appt, idx) => (
          <div key={idx} className="appointment-card">
            <div className="appointment-header">
              <div className="patient-info">
                <h3>{appt.patient}</h3>
                <span className="appointment-type">{appt.type}</span>
              </div>
              <span className={`status-badge status-${appt.status.toLowerCase()}`}>
                {appt.status}
              </span>
            </div>
            <div className="appointment-details">
              <div className="detail-item">
                <span className="label">Time:</span>
                <span className="value">{appt.time}</span>
              </div>
              <div className="detail-item">
                <span className="label">Date:</span>
                <span className="value">{appt.date}</span>
              </div>
              <div className="detail-item">
                <span className="label">Duration:</span>
                <span className="value">{appt.duration || '30 mins'}</span>
              </div>
            </div>
            <div className="appointment-actions">
              <button className="action-btn view-btn">View Details</button>
              <button className="action-btn reschedule-btn">Reschedule</button>
              <button className="action-btn cancel-btn">Cancel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMedicalRecordsTab = () => (
    <div className="tab-content">
      <div className="records-header">
        <h2>Medical Records</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search patient records..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button className="search-btn">Search</button>
        </div>
      </div>
      {selectedPatient ? (
        <div className="patient-records">
          <div className="patient-header">
            <h3>{selectedPatient.fullName}'s Medical Records</h3>
            <button className="back-btn" onClick={handleBackToSearch}>Back to Search</button>
          </div>
          <div className="records-list">
            {patientHistory.map((record, idx) => (
              <div key={idx} className="record-card">
                <div className="record-header">
                  <h4>{record.diagnosis}</h4>
                  <span className="record-date">{new Date(record.date).toLocaleDateString()}</span>
                </div>
                <div className="record-content">
                  <p><strong>Notes:</strong> {record.notes}</p>
                  <p><strong>Treatment:</strong> {record.treatment}</p>
                  {record.followUp && (
                    <p><strong>Follow-up:</strong> {record.followUp}</p>
                  )}
                </div>
                <div className="record-footer">
                  <span className="doctor-name">Dr. {record.doctorName}</span>
                  <button className="view-details-btn">View Full Record</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="search-prompt">
          <p>Search for a patient to view their medical records</p>
        </div>
      )}
    </div>
  );

  const renderPrescriptionsTab = () => (
    <div className="tab-content">
      <div className="prescriptions-header">
        <h2>Prescriptions</h2>
        {selectedPatient && (
          <button 
            className="new-prescription-btn"
            onClick={() => setShowPrescriptionForm(true)}
          >
            New Prescription
          </button>
        )}
      </div>
      {selectedPatient ? (
        <div className="prescriptions-container">
          {showPrescriptionForm && (
            <div className="prescription-form">
              <h3>New Prescription for {selectedPatient.fullName}</h3>
              <form onSubmit={handlePrescriptionSubmit}>
                {prescription.medications.map((med, index) => (
                  <div key={index} className="medication-input-group">
                    <input
                      type="text"
                      placeholder="Medication Name"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                    />
                    <button
                      type="button"
                      className="remove-medication-btn"
                      onClick={() => handleRemoveMedication(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="add-medication-btn" onClick={handleAddMedication}>
                  Add Another Medication
                </button>
                <textarea
                  placeholder="Special Instructions"
                  value={prescription.instructions}
                  onChange={(e) => setPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                />
                <textarea
                  placeholder="Additional Notes"
                  value={prescription.notes}
                  onChange={(e) => setPrescription(prev => ({ ...prev, notes: e.target.value }))}
                />
                <div className="form-actions">
                  <button type="submit" className="submit-btn">Save Prescription</button>
                  <button type="button" className="cancel-btn" onClick={() => setShowPrescriptionForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          <div className="prescriptions-list">
            {patientPrescriptions.map((prescription, idx) => (
              <div key={idx} className="prescription-card">
                <div className="prescription-header">
                  <span className="prescription-date">
                    {new Date(prescription.date).toLocaleDateString()}
                  </span>
                  <span className="prescription-doctor">Dr. {prescription.doctorName}</span>
                </div>
                <div className="medications">
                  {prescription.medications.map((med, mIdx) => (
                    <div key={mIdx} className="medication">
                      <strong>{med.name}</strong>
                      <p>Dosage: {med.dosage}</p>
                      <p>Frequency: {med.frequency}</p>
                      <p>Duration: {med.duration}</p>
                    </div>
                  ))}
                </div>
                {prescription.instructions && (
                  <div className="instructions">
                    <strong>Instructions:</strong>
                    <p>{prescription.instructions}</p>
                  </div>
                )}
                {prescription.notes && (
                  <div className="notes">
                    <strong>Notes:</strong>
                    <p>{prescription.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="search-prompt">
          <p>Search for a patient to view their prescriptions</p>
        </div>
      )}
    </div>
  );

  const renderLabResultsTab = () => (
    <div className="tab-content">
      <div className="lab-results-header">
        <h2>Lab Results</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search patient lab results..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button className="search-btn">Search</button>
        </div>
      </div>
      {selectedPatient ? (
        <div className="lab-results-container">
          <div className="patient-header">
            <h3>{selectedPatient.fullName}'s Lab Results</h3>
            <button className="back-btn" onClick={handleBackToSearch}>Back to Search</button>
          </div>
          <div className="lab-results-filters">
            <select className="filter-select">
              <option value="all">All Tests</option>
              <option value="blood">Blood Tests</option>
              <option value="urine">Urine Tests</option>
              <option value="imaging">Imaging</option>
            </select>
            <select className="filter-select">
              <option value="all">All Dates</option>
              <option value="recent">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div className="lab-results-list">
            {/* Lab results would be mapped here */}
            <div className="no-results-message">
              <p>No lab results found for this patient.</p>
              <button className="request-test-btn">Request New Test</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="search-prompt">
          <p>Search for a patient to view their lab results</p>
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="tab-content">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-container">
        <div className="settings-section">
          <h3>Profile Settings</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={doctorProfile?.name || ''} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={doctorProfile?.email || ''} />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input type="text" value={doctorProfile?.specialization || ''} />
            </div>
            <div className="form-group">
              <label>License Number</label>
              <input type="text" value={doctorProfile?.licenseNumber || ''} />
            </div>
            <button className="save-btn">Save Changes</button>
          </div>
        </div>
        <div className="settings-section">
          <h3>Availability</h3>
          <div className="availability-settings">
            <div className="form-group">
              <label>Working Hours</label>
              <div className="time-range">
                <input type="time" value="09:00" />
                <span>to</span>
                <input type="time" value="17:00" />
              </div>
            </div>
            <div className="form-group">
              <label>Appointment Duration</label>
              <select>
                <option value="15">15 minutes</option>
                <option value="30" selected>30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <button className="save-btn">Update Availability</button>
          </div>
        </div>
        <div className="settings-section">
          <h3>Notifications</h3>
          <div className="notification-settings">
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked />
                Email notifications for new appointments
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked />
                SMS notifications for urgent messages
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked />
                Reminders for upcoming appointments
              </label>
            </div>
            <button className="save-btn">Save Preferences</button>
          </div>
        </div>
        <div className="settings-section">
          <h3>Security</h3>
          <div className="security-settings">
            <button className="change-password-btn">Change Password</button>
            <button className="two-factor-btn">Enable Two-Factor Authentication</button>
            <button className="logout-btn">Logout</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard-new">
      <aside className="sidebar">
        <div className="sidebar-logo">MediCare</div>
        <div className="sidebar-user">
          <div className="user-avatar">DR</div>
          <div>
            <div className="user-name">Dr. {doctorProfile?.name || currentUser?.name || 'Smith'}</div>
            <div className="user-role">{doctorProfile?.specialization || 'Cardiologist'}</div>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <div className="top-bar">
          <div className="dashboard-title">Dashboard</div>
          <div className="top-bar-actions">
            <input 
              className="search-input-bar" 
              placeholder="Search patients..." 
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button className="new-appointment-btn">New Appointment</button>
          </div>
        </div>
        {renderTabs()}
        {error && activeSection !== 'patients' && <div className="dashboard-error">{error}</div>}
        {activeSection === 'dashboard' && (
          <>
            {renderSummaryCards()}
            {renderDashboardMain()}
          </>
        )}
        {activeSection === 'patients' && renderPatientsTab()}
        {activeSection === 'appointments' && renderAppointmentsTab()}
        {activeSection === 'medicalRecords' && renderMedicalRecordsTab()}
        {activeSection === 'prescriptions' && renderPrescriptionsTab()}
        {activeSection === 'labResults' && renderLabResultsTab()}
        {activeSection === 'settings' && renderSettingsTab()}
      </main>
    </div>
  );
};

export default DoctorDashboard;