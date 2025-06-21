import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import MedicalRecordItem from '../components/MedicalRecordItem';
import HealthCard from '../components/HealthCard';
import { Link, useNavigate } from 'react-router-dom';

const accentColor = '#3498db';
const secondaryColor = '#2980b9';
const cardBg = '#fff';
const borderColor = '#e3e8ee';
const textColor = '#22223b';
const lightBg = '#ecf0f1';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [showHealthCard, setShowHealthCard] = useState(false);
  const healthCardRef = useRef();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: {
      name: '',
      phone: ''
    }
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const profileRes = await api.get('/patients/profile');
        setProfile(profileRes.data.data);

        const recordsRes = await api.get('/patients/medical-history');
        setMedicalRecords(recordsRes.data.data);

        const allergiesRes = await api.get('/patients/allergies');
        setAllergies(allergiesRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || '',
        age: profile.age || '',
        gender: profile.gender || '',
        bloodGroup: profile.bloodGroup || '',
        emergencyContact: {
          name: profile.emergencyContact?.name || '',
          phone: profile.emergencyContact?.phone || ''
        }
      });
    }
  }, [profile]);

  const handleEditChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('emergencyContact.')) {
      setEditForm(f => ({
        ...f,
        emergencyContact: {
          ...f.emergencyContact,
          [name.split('.')[1]]: value
        }
      }));
    } else {
      setEditForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/patients/profile', editForm);
      alert('Profile updated!');
      setEditingProfile(false);
    } catch (err) {
      alert('Failed to update profile');
    }
    setSavingProfile(false);
  };

  // Print only the health card section
  const handlePrintHealthCard = () => {
    if (!healthCardRef.current) return;
    const printContents = healthCardRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleLogout = () => {
    // Clear any stored tokens/data
    localStorage.removeItem('token');
    // Redirect to login
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '👤';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length-1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  if (loading) {
    return <div style={{ color: accentColor, textAlign: 'center', marginTop: 60 }}>Loading...</div>;
  }

  if (!profile) {
    return (
      <div style={{
        background: cardBg, color: textColor, border: `1px solid ${borderColor}`,
        borderRadius: 12, padding: 32, margin: '60px auto', maxWidth: 500, textAlign: 'center'
      }}>
        <h2 style={{ color: accentColor }}>Error loading profile</h2>
        <p>Please try refreshing the page or contact support.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Modern Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        padding: '12px 24px'
      }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1280,
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              background: accentColor,
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ color: 'white', fontSize: 20 }}>➕</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>MediCard+</span>
          </div>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: '#f8fafc',
            padding: '8px 16px',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{profile.fullName}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Patient ID: {profile.patientId}</div>
            </div>
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: `${accentColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 600,
                color: accentColor
              }}>
                {getInitials(profile.fullName)}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ 
        maxWidth: 1280,
        margin: '32px auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 24
      }}>
        {/* Sidebar */}
        <aside>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ marginBottom: 24 }}>
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: '12px',
                    objectFit: 'cover',
                    marginBottom: 16
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: 200,
                  borderRadius: '12px',
                  marginBottom: 16,
                  background: `${accentColor}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 64,
                  fontWeight: 600,
                  color: accentColor
                }}>
                  {getInitials(profile.fullName)}
                </div>
              )}
              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e293b' }}>{profile.fullName}</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Patient ID: {profile.patientId}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => setShowHealthCard(true)}
                style={{
                  background: accentColor,
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                View Digital Card
              </button>
              
              <button
                style={{
                  background: '#f1f5f9',
                  color: '#1e293b',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            marginTop: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>Quick Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Blood Type</span>
                <span style={{ fontWeight: 500, color: '#1e293b' }}>{profile.bloodGroup}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Age</span>
                <span style={{ fontWeight: 500, color: '#1e293b' }}>{profile.age}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Gender</span>
                <span style={{ fontWeight: 500, color: '#1e293b' }}>{profile.gender}</span>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            marginTop: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>➜</span>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Allergies Section */}
          <section style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>Allergies</h2>
              <button style={{
                background: '#f1f5f9',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                color: accentColor,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}>
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allergies.map(allergy => (
                <span key={allergy._id} style={{
                  background: allergy.severity === 'High' ? '#fee2e2'
                    : allergy.severity === 'Moderate' ? '#fef3c7'
                      : '#ecfdf5',
                  color: allergy.severity === 'High' ? '#991b1b'
                    : allergy.severity === 'Moderate' ? '#92400e'
                      : '#065f46',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  {allergy.name}
                </span>
              ))}
            </div>
          </section>

          {/* Medical History Section */}
          <section style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>Medical History</h2>
              <button style={{
                background: '#f1f5f9',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                color: accentColor,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}>
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {medicalRecords.map(record => (
                <div key={record._id} style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1e293b' }}>{record.diseaseName}</h3>
                    <p style={{ fontSize: 14, color: '#64748b' }}>
                      {new Date(record.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    background: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: 14,
                    color: '#64748b'
                  }}>
                    View Details
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* AI Health Summary Section */}
          <section style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b' }}>AI Health Summary</h2>
              <span style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: 12,
                fontWeight: 500
              }}>
                Coming Soon
              </span>
            </div>

            <div style={{ 
              background: '#f8fafc',
              padding: '32px',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <p style={{ fontSize: 15, marginBottom: 8 }}>
                Our AI-powered health summary feature is under development.
              </p>
              <p style={{ fontSize: 14 }}>
                Soon you'll get personalized insights based on your medical history.
              </p>
            </div>
          </section>
        </div>
      </main>
      
      {/* Health Card Modal */}
      {showHealthCard && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, padding: 30, position: 'relative', minWidth: 350, maxWidth: 420
          }}>
            <button
              onClick={() => setShowHealthCard(false)}
              style={{
                position: 'absolute', top: 10, right: 10, background: 'none', border: 'none',
                fontSize: 24, color: '#888', cursor: 'pointer'
              }}
            >&times;</button>
            <div ref={healthCardRef}>
              <HealthCard patientData={profile} allergies={allergies} />
            </div>
            <button
              onClick={handlePrintHealthCard}
              style={{
                marginTop: 20,
                background: accentColor,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 24px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Download / Print
            </button>
          </div>
        </div>
      )}

      {/* Profile Editing Modal */}
      {editingProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, padding: 30, position: 'relative', minWidth: 350, maxWidth: 600
          }}>
            <button
              onClick={() => setEditingProfile(false)}
              style={{
                position: 'absolute', top: 10, right: 10, background: 'none', border: 'none',
                fontSize: 24, color: '#888', cursor: 'pointer'
              }}
            >&times;</button>
            <h2 style={{ color: textColor, marginBottom: 20 }}>Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Full Name</label>
                <input
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: '100%', padding: 10, borderRadius: 5, border: `1px solid ${borderColor}`,
                    fontSize: 16, color: textColor, background: '#f9f9f9'
                  }}
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Age</label>
                <input
                  name="age"
                  type="number"
                  value={editForm.age}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: '100%', padding: 10, borderRadius: 5, border: `1px solid ${borderColor}`,
                    fontSize: 16, color: textColor, background: '#f9f9f9'
                  }}
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Gender</label>
                <select
                  name="gender"
                  value={editForm.gender}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: '100%', padding: 10, borderRadius: 5, border: `1px solid ${borderColor}`,
                    fontSize: 16, color: textColor, background: '#f9f9f9'
                  }}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Blood Group</label>
                <input
                  name="bloodGroup"
                  value={editForm.bloodGroup}
                  onChange={handleEditChange}
                  required
                  style={{
                    width: '100%', padding: 10, borderRadius: 5, border: `1px solid ${borderColor}`,
                    fontSize: 16, color: textColor, background: '#f9f9f9'
                  }}
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Emergency Contact Name</label>
                <input
                  name="emergencyContact.name"
                  value={editForm.emergencyContact.name}
                  onChange={handleEditChange}
                  style={{
                    width: '100%', padding: 10, borderRadius: 5, border: `1px solid ${borderColor}`,
                    fontSize: 16, color: textColor, background: '#f9f9f9'
                  }}
                />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Emergency Contact Phone</label>
                <input
                  name="emergencyContact.phone"
                  value={editForm.emergencyContact.phone}
                  onChange={handleEditChange}
                  style={{
                    width: '100%', padding: 10, borderRadius: 5, border: `1px solid ${borderColor}`,
                    fontSize: 16, color: textColor, background: '#f9f9f9'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="submit" disabled={savingProfile} style={{
                  background: accentColor, color: '#fff', border: 'none', borderRadius: 5, padding: '10px 20px',
                  fontWeight: 600, cursor: 'pointer', flex: 1
                }}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingProfile(false)} style={{
                  background: '#eee', color: '#333', border: 'none', borderRadius: 5, padding: '10px 20px',
                  fontWeight: 600, cursor: 'pointer', flex: 1
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings item style
const settingsItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #eee',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 16
};
const settingsIconStyle = {
  width: 40,
  height: 40,
  backgroundColor: '#ecf0f1',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 15,
  color: '#2c3e50',
  fontSize: 20
};

export default PatientDashboard;