import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
  TextField,
  Stack,
  Button,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert
} from '@mui/material';
import {
  LocalHospital,
  People,
  CalendarToday,
  MedicalServices
} from '@mui/icons-material';
import DoctorManagement from './DoctorManagement';
import PatientManagement from './PatientManagement';
import dashboardService from '../../../services/dashboardService';
import './HospitalDashboard.css';

function HospitalDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState({ totalDoctors: 0, totalPatients: 0, appointmentsToday: 0 });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctorRoster, setDoctorRoster] = useState([]);
  const [contactForm, setContactForm] = useState({ phoneNumber: '', email: '', street: '', city: '', state: '', zipCode: '' });
  const [preferences, setPreferences] = useState({ autoAssignDoctors: true, notifyCriticalUpdates: true, shareSummaryWithDoctors: false });
  const [savingSettings, setSavingSettings] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchDepartments = async (token) => {
      try {
        const response = await fetch('/api/hospital/departments', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        setDepartments(data.ok ? data.departments : []);
      } catch { setDepartments([]); }
    };

    const fetchDashboardData = async () => {
      try {
        const userType = localStorage.getItem('userType');
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        let user = null;
        try { user = userData ? JSON.parse(userData) : null; } catch { user = null; }

        if (!token || !user || userType !== 'hospital') { navigate('/login'); return; }

        const hospital = await dashboardService.getHospitalDashboard(user.id, token);
        setDashboardData(hospital);
        setDoctorRoster(hospital.doctors || []);
        setStats({
          totalDoctors: hospital.doctors?.length || 0,
          totalPatients: hospital.doctors?.reduce((acc, doc) => acc + (doc.patients?.length || 0), 0) || 0,
          appointmentsToday: 0
        });
        setContactForm({
          phoneNumber: hospital.phoneNumber || '',
          email: hospital.email || '',
          street: hospital.address?.street || '',
          city: hospital.address?.city || '',
          state: hospital.address?.state || '',
          zipCode: hospital.address?.zipCode || ''
        });
        fetchDepartments(token);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const doctorAlerts = useMemo(() => {
    if (!doctorRoster.length) return [];
    return doctorRoster.slice(0, 4).map(doc => ({
      id: doc._id,
      name: doc.fullName,
      specialization: doc.specialization,
      status: doc.isActive ? 'On duty' : 'Off duty'
    }));
  }, [doctorRoster]);

  const handleSettingsSave = (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    }, 800);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="var(--color-bg)">
        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="var(--color-bg)">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="var(--color-bg)">
        <Typography sx={{ color: 'var(--color-text-muted)' }}>No dashboard data available.</Typography>
      </Box>
    );
  }

  const addressStr = [dashboardData.address?.street, dashboardData.address?.city, dashboardData.address?.state, dashboardData.address?.zipCode]
    .filter(Boolean).join(', ');

  return (
    <div className="hd-page">

      {/* ---- Header ---- */}
      <header className="hd-header">
        <div className="hd-header-inner">
          <div className="home-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <i className="fas fa-heartbeat brand-icon"></i>
            Medicard+
          </div>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#dc2626',
              color: 'white',
              '&:hover': { backgroundColor: '#b91c1c' },
              textTransform: 'none',
              fontWeight: 500
            }}
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('userType');
              window.location.href = '/login';
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="hd-content">

        {/* ---- Hospital Info Card ---- */}
        <Paper className="hd-info-card" elevation={0}>
          <Typography className="hd-hospital-name">
            {dashboardData.fullName || 'Hospital Dashboard'}
          </Typography>
          <div className="hd-hospital-meta">
            {dashboardData.registrationNumber && <span>Reg: {dashboardData.registrationNumber}</span>}
            {addressStr && <span>{addressStr}</span>}
          </div>
        </Paper>

        {/* ---- Stats Grid ---- */}
        <div className="hd-stats-grid">
          <Paper className="hd-stat-card" elevation={0}>
            <div className="hd-stat-inner">
              <div className="hd-stat-icon blue">
                <LocalHospital sx={{ fontSize: 24, color: 'var(--color-primary)' }} />
              </div>
              <div>
                <Typography className="hd-stat-value">{stats.totalDoctors}</Typography>
                <Typography className="hd-stat-label">Total Doctors</Typography>
              </div>
            </div>
          </Paper>

          <Paper className="hd-stat-card" elevation={0}>
            <div className="hd-stat-inner">
              <div className="hd-stat-icon green">
                <People sx={{ fontSize: 24, color: 'var(--color-green)' }} />
              </div>
              <div>
                <Typography className="hd-stat-value">{stats.totalPatients}</Typography>
                <Typography className="hd-stat-label">Total Patients</Typography>
              </div>
            </div>
          </Paper>

          <Paper className="hd-stat-card" elevation={0}>
            <div className="hd-stat-inner">
              <div className="hd-stat-icon orange">
                <CalendarToday sx={{ fontSize: 24, color: '#F97316' }} />
              </div>
              <div>
                <Typography className="hd-stat-value">{stats.appointmentsToday}</Typography>
                <Typography className="hd-stat-label">Today's Appointments</Typography>
              </div>
            </div>
          </Paper>
        </div>

        {/* ---- On-Duty Doctors + Capacity ---- */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper className="hd-card" elevation={0}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography className="hd-card-title">On-Duty Doctors</Typography>
                <Chip
                  label={`${doctorRoster.length} total`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', fontSize: 12 }}
                />
              </Box>
              {doctorRoster.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  No doctors assigned yet.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {doctorAlerts.map((doctor, index) => (
                    <React.Fragment key={doctor.id}>
                      <ListItem sx={{ px: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListItemAvatar>
                          <Avatar className="hd-doctor-avatar">{doctor.name?.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          sx={{ flex: 1, minWidth: 0 }}
                          primary={
                            <Typography sx={{ fontSize: 14, fontWeight: 500 }} noWrap>
                              {doctor.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ fontSize: 13, color: 'var(--color-text-secondary)' }} noWrap>
                              {doctor.specialization || 'General Practice'}
                            </Typography>
                          }
                        />
                        <Chip
                          label={doctor.status}
                          size="small"
                          color={doctor.status === 'On duty' ? 'success' : 'default'}
                          sx={{ flexShrink: 0 }}
                        />
                      </ListItem>
                      {index < doctorAlerts.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* ---- Facility Capacity ---- */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper className="hd-card" elevation={0}>
              <Typography className="hd-card-title" sx={{ mb: 2 }}>Facility Capacity Snapshot</Typography>
              {departments.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  No department data available.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {departments.slice(0, 4).map((dept) => (
                    <Box key={dept.id}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{dept.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{dept.patientCount} patients</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (dept.patientCount / Math.max(1, dept.doctorCount * 10)) * 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
        

        {/* ---- Main Tabs ---- */}
        <Paper className="hd-tabs-card" elevation={0}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Doctor Management" />
            <Tab label="Patient Management" />
            <Tab label="Departments" />
            <Tab label="Settings" />
          </Tabs>

          <div className="hd-tab-content">
            {activeTab === 0 && <DoctorManagement />}

            {activeTab === 1 && <PatientManagement />}

            {activeTab === 2 && (
              <div>
                <Typography className="hd-card-title" sx={{ mb: 3 }}>Departments Overview</Typography>
                {departments.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                    No departments configured for this hospital.
                  </Typography>
                ) : (
                  <div className="hd-departments-grid">
                    {departments.map(dept => (
                      <div key={dept.id} className="hd-department-card">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography className="hd-dept-name">{dept.name}</Typography>
                          <Chip label={`${dept.doctorCount} doctors`} size="small" variant="outlined"
                            sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', fontSize: 11 }} />
                        </Box>
                        <Typography className="hd-dept-load">Estimated load: {dept.patientCount} patients</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (dept.patientCount / Math.max(1, dept.doctorCount * 12)) * 100)}
                          sx={{ my: 1.5, height: 8, borderRadius: 4 }}
                        />
                        <Stack direction="row" spacing={1} mt={1}>
                          <Button className="hd-btn-primary" variant="contained" size="small">View roster</Button>
                          <Button className="hd-btn-outline" variant="outlined" size="small">Configure</Button>
                        </Stack>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 3 && (
              <form onSubmit={handleSettingsSave} className="hd-settings-form">
                <Typography className="hd-settings-title">Contact & Facility Settings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Primary Phone" fullWidth size="small" value={contactForm.phoneNumber}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phoneNumber: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Admin Email" type="email" fullWidth size="small" value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Street" fullWidth size="small" value={contactForm.street}
                      onChange={(e) => setContactForm(prev => ({ ...prev, street: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="City" fullWidth size="small" value={contactForm.city}
                      onChange={(e) => setContactForm(prev => ({ ...prev, city: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="State" fullWidth size="small" value={contactForm.state}
                      onChange={(e) => setContactForm(prev => ({ ...prev, state: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="ZIP" fullWidth size="small" value={contactForm.zipCode}
                      onChange={(e) => setContactForm(prev => ({ ...prev, zipCode: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch checked={preferences.autoAssignDoctors}
                          onChange={(e) => setPreferences(prev => ({ ...prev, autoAssignDoctors: e.target.checked }))}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--color-primary)' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--color-primary)' } }}
                        />
                      }
                      label={<Typography sx={{ fontSize: 14 }}>Auto assign doctors to new admissions</Typography>}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" className="hd-btn-primary" variant="contained" disabled={savingSettings}>
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </div>
        </Paper>

      </div>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default HospitalDashboard;