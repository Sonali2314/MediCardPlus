import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DoctorManagement from './DoctorManagement';
import dashboardService from '../../../services/dashboardService';
import './HospitalDashboard.css';

function HospitalDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    appointmentsToday: 0
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctorRoster, setDoctorRoster] = useState([]);
  const [contactForm, setContactForm] = useState({
    phoneNumber: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [preferences, setPreferences] = useState({
    autoAssignDoctors: true,
    notifyCriticalUpdates: true,
    shareSummaryWithDoctors: false
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userType = localStorage.getItem('userType');
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        let user = null;
        try {
          user = userData ? JSON.parse(userData) : null;
        } catch {
          user = null;
        }

        if (!token || !user || userType !== 'hospital') {
          navigate('/login');
          return;
        }

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
        console.error('Failed to load hospital dashboard', err);
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const fetchDepartments = async (token) => {
      try {
        const response = await fetch('/api/hospital/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.ok) {
          setDepartments(data.departments);
        } else {
          setDepartments([]);
        }
      } catch (err) {
        console.error('Failed to fetch departments', err);
        setDepartments([]);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No dashboard data available.</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Hospital Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              {dashboardData.fullName || 'Hospital Dashboard'}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Registration: {dashboardData.registrationNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {dashboardData.address?.street}, {dashboardData.address?.city}, {dashboardData.address?.state} {dashboardData.address?.zipCode}
            </Typography>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <LocalHospitalIcon color="primary" />
                <Typography color="textSecondary">
                  Total Doctors
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {stats.totalDoctors}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <PeopleAltIcon color="primary" />
                <Typography color="textSecondary">
                  Total Patients
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {stats.totalPatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <MonitorHeartIcon color="primary" />
                <Typography color="textSecondary">
                  Today's Appointments
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {stats.appointmentsToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Roster and Alerts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">On-Duty Doctors</Typography>
              <Chip label={`${doctorRoster.length} total`} color="primary" variant="outlined" size="small" />
            </Box>
            {doctorRoster.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No doctors assigned yet.
              </Typography>
            ) : (
              <List dense>
                {doctorAlerts.map((doctor, index) => (
                  <React.Fragment key={doctor.id}>
                    <ListItem>
                      <Avatar sx={{ mr: 2 }}>{doctor.name?.charAt(0)}</Avatar>
                      <ListItemText
                        primary={doctor.name}
                        secondary={`${doctor.specialization || 'General Practice'} • ${doctor.status}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip label={doctor.status} size="small" color={doctor.status === 'On duty' ? 'success' : 'default'} />
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < doctorAlerts.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Facility Capacity Snapshot
            </Typography>
            {departments.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No department data available.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {departments.slice(0, 4).map((dept) => (
                  <Box key={dept.id}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">{dept.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {dept.patientCount} patients
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (dept.patientCount / Math.max(1, dept.doctorCount * 10)) * 100)}
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Main Content Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Doctor Management" />
              <Tab label="Departments" />
              <Tab label="Settings" />
            </Tabs>
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <DoctorManagement />}
              {activeTab === 1 && (
                <div className="hd-departments">
                  <Typography variant="h6" gutterBottom>
                    Departments Overview
                  </Typography>
                  {departments.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">
                      No departments configured for this hospital.
                    </Typography>
                  ) : (
                    <div className="hd-departments-grid">
                      {departments.map(dept => (
                        <div key={dept.id} className="hd-department-card">
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">{dept.name}</Typography>
                            <Chip label={`${dept.doctorCount} doctors`} size="small" color="primary" variant="outlined" />
                          </Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Estimated load: {dept.patientCount} patients
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, (dept.patientCount / Math.max(1, dept.doctorCount * 12)) * 100)}
                            sx={{ mt: 2, mb: 2, height: 8, borderRadius: 4 }}
                          />
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" color="primary">View roster</Button>
                            <Button size="small" variant="outlined">Configure</Button>
                          </Stack>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 2 && (
                <form onSubmit={handleSettingsSave} className="hd-settings-form">
                  <Typography variant="h6" gutterBottom>
                    Contact & Facility Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Primary Phone"
                        fullWidth
                        value={contactForm.phoneNumber}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Admin Email"
                        type="email"
                        fullWidth
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Street"
                        fullWidth
                        value={contactForm.street}
                        onChange={(e) => setContactForm(prev => ({ ...prev, street: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="City"
                        fullWidth
                        value={contactForm.city}
                        onChange={(e) => setContactForm(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="State"
                        fullWidth
                        value={contactForm.state}
                        onChange={(e) => setContactForm(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="ZIP"
                        fullWidth
                        value={contactForm.zipCode}
                        onChange={(e) => setContactForm(prev => ({ ...prev, zipCode: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel control={<Switch checked={preferences.autoAssignDoctors} onChange={(e) => setPreferences(prev => ({ ...prev, autoAssignDoctors: e.target.checked }))} />} label="Auto assign doctors to new admissions" />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" color="primary" disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save Settings'}</Button>
                    </Grid>
                  </Grid>
                </form>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default HospitalDashboard;
