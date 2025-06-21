import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const accentColor = '#3498db';
const cardBg = '#fff';
const borderColor = '#e3e8ee';
const textColor = '#22223b';
const lightBg = '#f7fafd';

const AdminPanel = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser && !loading) {
      navigate('/login');
      return;
    }
    if (currentUser && userRole !== 'admin') {
      navigate('/login');
      return;
    }
    if (currentUser && userRole === 'admin') {
      fetchDoctors();
    }
    // eslint-disable-next-line
  }, [currentUser, userRole, navigate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/doctors');
      const doctorsData = response.data.data;
      setDoctors(doctorsData);
      
      // Calculate stats
      setStats({
        totalDoctors: doctorsData.length,
        pendingCount: doctorsData.filter(doc => doc.approvalStatus === 'pending').length,
        approvedCount: doctorsData.filter(doc => doc.approvalStatus === 'approved').length,
        rejectedCount: doctorsData.filter(doc => doc.approvalStatus === 'rejected').length
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to load doctor registrations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorApproval = async (id, status) => {
    try {
      await api.put(`/admin/doctors/${id}/status`, { isVerified: status === 'approved' });
      setDoctors(doctors.map(doctor =>
        doctor._id === id ? { ...doctor, approvalStatus: status } : doctor
      ));
    } catch (err) {
      setError('Failed to update doctor approval status');
      console.error(err);
    }
  };

  const pendingDoctors = doctors.filter(doc => doc.approvalStatus === 'pending');
  const approvedDoctors = doctors.filter(doc => doc.approvalStatus === 'approved');

  if (loading) {
    return <div style={{ color: accentColor, textAlign: 'center', marginTop: 120 }}>Loading...</div>;
  }

  if (!currentUser || userRole !== 'admin') {
    return null;
  }

  return (
    <div style={{ background: lightBg, minHeight: '100vh', paddingBottom: 40 }}>
      {/* Admin Header */}
      <header style={{
        background: accentColor,
        color: '#fff',
        padding: '20px 0 8px 0',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        boxShadow: '0 4px 24px rgba(46,139,192,0.08)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 700, fontSize: 28 }}>Admin Panel</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: 16, opacity: 0.9 }}>
              Manage doctor registrations and system overview
            </p>
          </div>
          <div style={{
            background: '#fff',
            color: accentColor,
            borderRadius: 12,
            padding: '8px 20px',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(46,139,192,0.10)',
            display: 'flex',
            alignItems: 'center',
            gap: 20
          }}>
            <span style={{ color: textColor, fontSize: 15 }}>
              Logged in as: <strong>{currentUser?.email}</strong>
            </span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{
                background: accentColor,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 15,
                transition: 'all 0.2s ease'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 32px auto',
        marginTop: '14vh',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 24
      }}>
        <StatCard
          title="Total Doctors"
          value={stats.totalDoctors}
          color="#3498db"
          icon="👥"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingCount}
          color="#f39c12"
          icon="⏳"
        />
        <StatCard
          title="Approved Doctors"
          value={stats.approvedCount}
          color="#2ecc71"
          icon="✅"
        />
        <StatCard
          title="Rejected Applications"
          value={stats.rejectedCount}
          color="#e74c3c"
          icon="❌"
        />
      </div>

      {/* Doctor Panels */}
      <div style={{
        display: 'flex',
        gap: 32,
        maxWidth: 1200,
        margin: '32px auto',
        padding: '0 24px',
        flexWrap: 'wrap'
      }}>
        {/* Approved Doctors Panel */}
        <div style={{
          flex: 1,
          background: cardBg,
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(46,139,192,0.07)',
          border: `1px solid ${borderColor}`,
          padding: 24,
          minWidth: 320
        }}>
          <h2 style={{ color: accentColor, fontSize: 22, marginBottom: 16 }}>
            Approved Doctors <span style={{ fontSize: 16, color: '#888' }}>({approvedDoctors.length})</span>
          </h2>
          {approvedDoctors.length === 0 ? (
            <div style={{ color: '#888', padding: '20px 0' }}>No approved doctors</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {approvedDoctors.map(doc => (
                <li key={doc._id} style={{
                  borderBottom: '1px solid #eee',
                  padding: '12px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>{doc.name}</strong>
                    <span style={{ color: '#888', fontSize: 14, marginLeft: 8 }}>({doc.specialization})</span>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{doc.hospitalName}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      Registered: {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    style={rejectBtnStyle}
                    onClick={() => handleDoctorApproval(doc._id, 'rejected')}
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending Doctors Panel */}
        <div style={{
          flex: 1,
          background: cardBg,
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(46,139,192,0.07)',
          border: `1px solid ${borderColor}`,
          padding: 24,
          minWidth: 320
        }}>
          <h2 style={{ color: accentColor, fontSize: 22, marginBottom: 16 }}>
            Pending Doctors <span style={{ fontSize: 16, color: '#888' }}>({pendingDoctors.length})</span>
          </h2>
          {pendingDoctors.length === 0 ? (
            <div style={{ color: '#888', padding: '20px 0' }}>No pending doctors</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {pendingDoctors.map(doc => (
                <li key={doc._id} style={{
                  borderBottom: '1px solid #eee',
                  padding: '12px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>{doc.name}</strong>
                    <span style={{ color: '#888', fontSize: 14, marginLeft: 8 }}>({doc.specialization})</span>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{doc.hospitalName}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      Applied: {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={approveBtnStyle}
                      onClick={() => handleDoctorApproval(doc._id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      style={rejectBtnStyle}
                      onClick={() => handleDoctorApproval(doc._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Table Section */}
      <main style={{
        maxWidth: 1200,
        margin: '32px auto',
        padding: '0 24px',
        background: cardBg,
        borderRadius: 18,
        boxShadow: '0 2px 16px rgba(46,139,192,0.07)',
        padding: 24,
        minHeight: 500
      }}>
        {error && <div style={{
          background: '#fdecea',
          color: '#c0392b',
          border: '1px solid #f5c6cb',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24
        }}>{error}</div>}

        <section>
          <h2 style={{ color: accentColor, fontSize: 24, marginBottom: 20 }}>All Doctor Registrations</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Specialization</th>
                  <th style={thStyle}>Hospital</th>
                  <th style={thStyle}>Registration No.</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Documents</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor, idx) => (
                  <tr
                    key={doctor._id}
                    style={{
                      background: idx % 2 === 0 ? '#f8fbff' : '#fff',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={tdStyle}>{doctor.name}</td>
                    <td style={tdStyle}>{doctor.specialization}</td>
                    <td style={tdStyle}>{doctor.hospitalName}</td>
                    <td style={tdStyle}>{doctor.registrationNumber}</td>
                    <td style={tdStyle}>{doctor.contactNumber}</td>
                    <td style={tdStyle}>
                      <span style={{
                        color:
                          doctor.approvalStatus === 'approved'
                            ? '#2ecc71'
                            : doctor.approvalStatus === 'pending'
                            ? '#f39c12'
                            : '#e74c3c',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: doctor.approvalStatus === 'approved'
                          ? '#e8f8f5'
                          : doctor.approvalStatus === 'pending'
                          ? '#fef9e7'
                          : '#fdedec'
                      }}>
                        {doctor.approvalStatus.charAt(0).toUpperCase() + doctor.approvalStatus.slice(1)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <a 
                        href={doctor.medicalLicense} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          color: accentColor, 
                          textDecoration: 'none',
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: '#eaf3fa',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        View License
                      </a>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {doctor.approvalStatus === 'pending' && (
                          <>
                            <button
                              style={approveBtnStyle}
                              onClick={() => handleDoctorApproval(doctor._id, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              style={rejectBtnStyle}
                              onClick={() => handleDoctorApproval(doctor._id, 'rejected')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {doctor.approvalStatus === 'approved' && (
                          <button
                            style={rejectBtnStyle}
                            onClick={() => handleDoctorApproval(doctor._id, 'rejected')}
                          >
                            Revoke
                          </button>
                        )}
                        {doctor.approvalStatus === 'rejected' && (
                          <button
                            style={approveBtnStyle}
                            onClick={() => handleDoctorApproval(doctor._id, 'approved')}
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, color, icon }) => (
  <div style={{
    background: cardBg,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 16px rgba(46,139,192,0.07)',
    border: `1px solid ${borderColor}`,
    display: 'flex',
    alignItems: 'center',
    gap: 16
  }}>
    <div style={{
      background: `${color}15`,
      color: color,
      width: 48,
      height: 48,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: textColor }}>{value}</div>
    </div>
  </div>
);

// Table and button styles
const tableStyle = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  background: '#fff',
  borderRadius: 12,
  overflow: 'hidden',
  marginTop: 8,
  marginBottom: 16,
  fontSize: 15,
  boxShadow: '0 1px 6px rgba(46,139,192,0.06)'
};

const thStyle = {
  background: '#eaf3fa',
  color: '#22223b',
  fontWeight: 700,
  padding: '14px 16px',
  borderBottom: `2px solid ${borderColor}`,
  textAlign: 'left',
  fontSize: 14
};

const tdStyle = {
  padding: '12px 16px',
  borderBottom: `1px solid ${borderColor}`,
  verticalAlign: 'middle',
  fontSize: 14
};

const approveBtnStyle = {
  background: '#2ecc71',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 14,
  transition: 'all 0.2s ease',
  ':hover': {
    background: '#27ae60'
  }
};

const rejectBtnStyle = {
  background: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 14,
  transition: 'all 0.2s ease',
  ':hover': {
    background: '#c0392b'
  }
};

export default AdminPanel;