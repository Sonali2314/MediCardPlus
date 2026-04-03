import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import {
  LocalHospital,
  CalendarToday,
  FlashOn,
  Person,
  Search,
  Add
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../../services/dashboardService';
import './DoctorDashboard.css';

function DoctorDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [careTasks, setCareTasks] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userType = localStorage.getItem('userType');
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        let user = null;
        try { user = userData ? JSON.parse(userData) : null; } catch { user = null; }

        if (!token || !user || userType !== 'doctor') { navigate('/login'); return; }

        const data = await dashboardService.getDoctorDashboard(user.id, token);
        setDashboardData(data);

        const doctorPatientsData = await dashboardService.getDoctorPatients(user.id, token);
        setDoctorPatients(doctorPatientsData);
        setPatients([]);

        const generatedAppointments = doctorPatientsData.slice(0, 6).map((patient, index) => {
          const today = new Date();
          const slot = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9 + index, index % 2 === 0 ? 0 : 30);
          return {
            id: `${patient.id}-appt`,
            patientName: patient.name,
            reason: patient.condition !== 'N/A' ? patient.condition : 'Routine check-up',
            time: slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            location: index % 2 === 0 ? 'Room 204' : 'Tele-consult',
            priority: index === 0 ? 'High' : index % 3 === 0 ? 'Medium' : 'Low'
          };
        });
        setAppointments(generatedAppointments);

        setCareTasks([]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) { setPatients([]); return; }
      setSearchLoading(true);
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        let user = null;
        try { user = userData ? JSON.parse(userData) : null; } catch { user = null; }
        if (user && token) {
          const searchResults = await dashboardService.searchPatients(user.id, searchQuery, token);
          setPatients(searchResults);
        }
      } catch (err) {
        setPatients([]);
      } finally {
        setSearchLoading(false);
      }
    };
    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const displayPatients = searchQuery.trim() ? patients : doctorPatients;

  const handleAddPatient = async (patientId) => {
    setAddLoading(patientId);
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      let user = null;
      try { user = userData ? JSON.parse(userData) : null; } catch { user = null; }
      if (user && token) {
        await dashboardService.addPatientToDoctor(user.id, patientId, token);
        const updatedPatients = await dashboardService.getDoctorPatients(user.id, token);
        setDoctorPatients(updatedPatients);
        setPatients([]);
        setSearchQuery('');
        setSnackbar({ open: true, message: 'Patient added to your panel', severity: 'success' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Unable to add patient', severity: 'error' });
    } finally {
      setAddLoading(null);
    }
  };

  const todaysAppointments = useMemo(() => {
    if (!appointments.length) return 0;
    const today = new Date().toDateString();
    return appointments.filter(appt => {
      const parsed = new Date(`${today} ${appt.time}`);
      return parsed.toDateString() === today;
    }).length;
  }, [appointments]);

  const highPriorityTasks = useMemo(
    () => careTasks.filter(task => task.priority === 'High').length,
    [careTasks]
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="var(--color-bg)">
        <CircularProgress sx={{ color: 'var(--color-green)' }} />
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

  if (!dashboardData) return null;

  const initials = dashboardData.fullName
    ? dashboardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'DR';

  return (
    <div className="dd-page">

      {/* ---- Header ---- */}
      <header className="dd-header">
        <div className="dd-header-inner">
          <div className="home-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <i className="fas fa-heartbeat brand-icon"></i>
            Medicard+
          </div>
          <div className="dd-header-right">
            <div>
              <Typography className="dd-doctor-name">{dashboardData.fullName}</Typography>
              <Typography className="dd-doctor-spec">{dashboardData.specialization}</Typography>
            </div>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#dc2626',
                color: 'white',
                '&:hover': { backgroundColor: '#b91c1c' },
                textTransform: 'none',
                fontWeight: 500,
                marginLeft: 2
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
        </div>
      </header>

      <div className="dd-content">

        {/* ---- Doctor Info Card ---- */}
        <Paper className="dd-info-card" elevation={0}>
          <div className="dd-info-card-inner">
            <Avatar className="dd-avatar">{initials}</Avatar>
            <div style={{ flex: 1 }}>
              <Typography className="dd-doctor-info-name">{dashboardData.fullName}</Typography>
              <div className="dd-doctor-meta">
                <span>{dashboardData.specialization}</span>
                {dashboardData.licenseNumber && <span>License: {dashboardData.licenseNumber}</span>}
                {dashboardData.email && <span>{dashboardData.email}</span>}
                {dashboardData.phoneNumber && <span>{dashboardData.phoneNumber}</span>}
                {dashboardData.hospital?.fullName && (
                  <span>Hospital: {dashboardData.hospital.fullName}</span>
                )}
              </div>
            </div>
          </div>
        </Paper>

        {/* ---- Stats Grid ---- */}
        <div className="dd-stats-grid">
          <Paper className="dd-stat-card" elevation={0}>
            <div className="dd-stat-inner">
              <div className="dd-stat-icon green">
                <Person sx={{ fontSize: 24, color: 'var(--color-green)' }} />
              </div>
              <div>
                <Typography className="dd-stat-value">{doctorPatients.length}</Typography>
                <Typography className="dd-stat-label">Total Patients</Typography>
              </div>
            </div>
          </Paper>

          <Paper className="dd-stat-card" elevation={0}>
            <div className="dd-stat-inner">
              <div className="dd-stat-icon blue">
                <CalendarToday sx={{ fontSize: 24, color: 'var(--color-primary)' }} />
              </div>
              <div>
                <Typography className="dd-stat-value">{todaysAppointments}</Typography>
                <Typography className="dd-stat-label">Appointments Today</Typography>
              </div>
            </div>
          </Paper>

          <Paper className="dd-stat-card" elevation={0}>
            <div className="dd-stat-inner">
              <div className="dd-stat-icon orange">
                <FlashOn sx={{ fontSize: 24, color: '#F97316' }} />
              </div>
              <div>
                <Typography className="dd-stat-value">{highPriorityTasks}</Typography>
                <Typography className="dd-stat-label">High Priority Tasks</Typography>
              </div>
            </div>
          </Paper>
        </div>

        {/* ---- Patients Table ---- */}
        <Paper className="dd-patients-card" elevation={0}>
          <div className="dd-patients-header">
            <Typography className="dd-card-title">My Patients</Typography>
            <Box display="flex" alignItems="center" gap={1.5}>
              <div className="dd-search-wrap">
                <TextField
                  size="small"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  inputRef={searchInputRef}
                  InputProps={{ startAdornment: <Search sx={{ fontSize: 18, color: 'var(--color-text-muted)', mr: 0.5 }} /> }}
                />
              </div>
              <Button
                className="dd-btn-primary"
                variant="contained"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={() => searchInputRef.current?.focus()}
              >
                Add Patient
              </Button>
            </Box>
          </div>

          <TableContainer className="dd-table-wrap">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Last Visit</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={20} sx={{ color: 'var(--color-green)' }} />
                    </TableCell>
                  </TableRow>
                ) : displayPatients.length === 0 && searchQuery.trim() ? (
                  <TableRow className="dd-empty-row">
                    <TableCell colSpan={5}>No patients found matching "{searchQuery}"</TableCell>
                  </TableRow>
                ) : displayPatients.length === 0 ? (
                  <TableRow className="dd-empty-row">
                    <TableCell colSpan={5}>No patients added yet. Use search to add patients.</TableCell>
                  </TableRow>
                ) : (
                  displayPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>{patient.condition}</TableCell>
                      <TableCell>{patient.lastVisit}</TableCell>
                      <TableCell align="right">
                        {searchQuery.trim() ? (
                          <Button
                            className="dd-btn-primary"
                            variant="contained"
                            size="small"
                            disabled={addLoading === patient.id}
                            onClick={() => handleAddPatient(patient.id)}
                          >
                            {addLoading === patient.id ? 'Adding...' : 'Add'}
                          </Button>
                        ) : (
                          <Box display="flex" gap={1} justifyContent="flex-end">
                            <Button
                              className="dd-btn-outline-blue"
                              variant="outlined"
                              size="small"
                              onClick={() => { setSelectedPatient(patient); setPatientDialogOpen(true); }}
                            >
                              View
                            </Button>
                            <Tooltip title="Schedule follow-up">
                              <span>
                                <Button className="dd-btn-outline" variant="outlined" size="small">
                                  Schedule
                                </Button>
                              </span>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ---- Schedule & Tasks ---- */}
        <Grid container spacing={3}>
          {/* Today's Schedule */}
          <Grid item xs={12} md={6}>
            <Paper className="dd-card" elevation={0}>
              <div className="dd-card-header">
                <Typography className="dd-card-title">Today's Schedule</Typography>
                <Chip label={`${appointments.length} bookings`} size="small" variant="outlined"
                  sx={{ borderColor: 'var(--color-green)', color: 'var(--color-green)', fontSize: 12 }} />
              </div>
              {appointments.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  No appointments scheduled for today.
                </Typography>
              ) : (
                <List dense className="dd-schedule-list" disablePadding>
                  {appointments.map((appointment, index) => (
                    <React.Fragment key={appointment.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar className={index === 0 ? 'dd-list-avatar-green' : 'dd-list-avatar-blue'}>
                            {appointment.patientName?.charAt(0) || 'P'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography sx={{ fontSize: 14, fontWeight: 500 }}>{appointment.patientName}</Typography>}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                                {appointment.time} · {appointment.location}
                              </Typography>
                              <Typography component="span" variant="body2" sx={{ color: 'var(--color-text-muted)', display: 'block' }}>
                                {appointment.reason}
                              </Typography>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={appointment.priority}
                            color={appointment.priority === 'High' ? 'error' : appointment.priority === 'Medium' ? 'warning' : 'default'}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < appointments.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Care Tasks */}
          <Grid item xs={12} md={6}>
            <Paper className="dd-card" elevation={0}>
              <div className="dd-card-header">
                <Typography className="dd-card-title">Care Tasks</Typography>
                <Chip label={`${careTasks.length} tasks`} size="small" variant="outlined"
                  sx={{ fontSize: 12 }} />
              </div>
              {careTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  No pending tasks. Great job!
                </Typography>
              ) : (
                <List dense className="dd-tasks-list" disablePadding>
                  {careTasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemText
                          primary={<Typography sx={{ fontSize: 14, fontWeight: 500 }}>{task.title}</Typography>}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                                {task.patientName}
                              </Typography>
                              <Typography component="span" variant="body2" sx={{ color: 'var(--color-text-muted)', display: 'block' }}>
                                Due {task.due}
                              </Typography>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={task.priority}
                            color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < careTasks.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>

      </div>

      {/* ---- Patient Dialog ---- */}
      <Dialog open={patientDialogOpen} onClose={() => setPatientDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography className="dd-dialog-title">Patient Snapshot</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPatient ? (
            <>
              <DialogContentText component="div">
                <Typography className="dd-patient-name-dialog">{selectedPatient.name}</Typography>
                <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>Age {selectedPatient.age}</Typography>
              </DialogContentText>
              <Box mt={2} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2"><strong>Current Concern:</strong> {selectedPatient.condition}</Typography>
                <Typography variant="body2"><strong>Last Visit:</strong> {selectedPatient.lastVisit}</Typography>
              </Box>
              <Box mt={2}>
                <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
                  Additional medical history coming soon.
                </Typography>
              </Box>
            </>
          ) : (
            <Typography variant="body2">No patient selected.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button className="dd-btn-outline-blue" variant="outlined" onClick={() => setPatientDialogOpen(false)}>
            Close
          </Button>
          <Button
            className="dd-btn-primary"
            variant="contained"
            onClick={() => {
              setPatientDialogOpen(false);
              setSnackbar({ open: true, message: 'Patient summary exported', severity: 'success' });
            }}
          >
            Export Summary
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default DoctorDashboard;