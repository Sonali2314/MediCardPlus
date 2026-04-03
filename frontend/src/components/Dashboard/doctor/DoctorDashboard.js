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
  DialogActions,
  Snackbar,
  Alert,
  Fab,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CalendarToday,
  FlashOn,
  Person,
  Search,
  Add,
  Chat,
  Send,
  Close,
  AttachFile
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../../services/dashboardService';
import EmergencyCard from '../patient/medicard/EmergencyCard';
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
  const [patientData, setPatientData] = useState(null);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Load chat messages from localStorage when component mounts
  useEffect(() => {
    const savedChatMessages = localStorage.getItem('medicard_chat_messages');
    if (savedChatMessages) {
      try {
        setChatMessages(JSON.parse(savedChatMessages));
      } catch (err) {
        console.error('Error loading chat messages:', err);
      }
    }
  }, []);

  // Save chat messages to localStorage whenever they change
  useEffect(() => {
    if (chatMessages.length > 0) {
      try {
        localStorage.setItem('medicard_chat_messages', JSON.stringify(chatMessages));
      } catch (err) {
        console.error('Error saving chat messages:', err);
      }
    }
  }, [chatMessages]);

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
            priority: 'Medium'
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

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredDoctorPatients = normalizedSearch
    ? doctorPatients.filter((patient) => patient.name.toLowerCase().includes(normalizedSearch))
    : doctorPatients;

  const displayPatients = normalizedSearch
    ? (patients.length > 0 ? patients : filteredDoctorPatients)
    : doctorPatients;

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

  const handleOpenChat = () => {
    setChatDialogOpen(true);
    setChatQuestion('');
    setUploadedFiles([]);
  };

  const handleCloseChat = () => {
    setChatDialogOpen(false);
    // Clear chat messages and localStorage when closing dialog
    setChatMessages([]);
    localStorage.removeItem('medicard_chat_messages');
    setChatQuestion('');
    setUploadedFiles([]);
  };

  const handleSendChatMessage = async () => {
    if (!chatQuestion.trim() && uploadedFiles.length === 0) return;

    const question = chatQuestion.trim();
    setChatQuestion('');
    setChatLoading(true);

    // Add user message
    const userMessage = question || `Uploaded ${uploadedFiles.length} file(s) for analysis`;
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage, files: uploadedFiles }]);

    try {
      // Read file contents
      const fileContents = [];
      for (const file of uploadedFiles) {
        try {
          const content = await file.text();
          fileContents.push({
            name: file.name,
            type: file.type,
            content: content
          });
        } catch (error) {
          console.error('Error reading file:', file.name, error);
          fileContents.push({
            name: file.name,
            type: file.type,
            content: '[Error reading file]'
          });
        }
      }

      // Prepare patient data
      const mockPatientData = {
        patient_name: selectedPatient?.name || 'Patient',
        patient_age: selectedPatient?.age || 0,
        patient_history: selectedPatient?.condition ? 
          `Patient has ${selectedPatient.condition}. Last visit: ${selectedPatient.lastVisit}.` :
          'Patient medical history not available.',
        question: question,
        uploaded_files: fileContents
      };

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockPatientData),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI assistant');
      }

      const data = await response.json();
      
      // Add AI response
      setChatMessages(prev => [...prev, { type: 'ai', text: data.summary }]);
      
      // Clear uploaded files after successful send
      setUploadedFiles([]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        type: 'ai', 
        text: 'Sorry, I encountered an error. Please try again or check if the AI service is running.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 20;

    if (uploadedFiles.length + files.length > maxFiles) {
      setSnackbar({ open: true, message: `Maximum ${maxFiles} files allowed`, severity: 'error' });
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      if (file.size > maxFileSize) {
        invalidFiles.push(`${file.name} (too large)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setSnackbar({ 
        open: true, 
        message: `Files too large: ${invalidFiles.join(', ')}`, 
        severity: 'error' 
      });
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }

    // Clear the input
    event.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAppointmentPriority = (appointmentId, value) => {
    setAppointments(prev => prev.map(appt => appt.id === appointmentId ? { ...appt, priority: value } : appt));
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatientDialogOpen(true);
    setLoadingPatientData(true);
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      let user = null;
      try { user = userData ? JSON.parse(userData) : null; } catch { user = null; }
      if (user && token) {
        const data = await dashboardService.getPatientDashboard(patient.id, token);
        setPatientData(data);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setPatientData(null);
    } finally {
      setLoadingPatientData(false);
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

  const mediumAppointments = useMemo(
    () => appointments.filter(appt => appt.priority === 'Medium').length,
    [appointments]
  );

  const lowAppointments = useMemo(
    () => appointments.filter(appt => appt.priority === 'Low').length,
    [appointments]
  );

  const emergencyQrPayload = patientData ? JSON.stringify({
    id: patientData._id,
    name: patientData.fullName,
    bloodGroup: patientData.bloodGroup || 'Unknown',
    phone: patientData.phoneNumber,
    emergencyNote: 'For emergency use only'
  }) : '';

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
                              onClick={() => handleViewPatient(patient)}
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
                <div>
                  <Typography className="dd-card-title">Today's Schedule</Typography>
                  <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
                    Medium {mediumAppointments} • Low {lowAppointments}
                  </Typography>
                </div>
                <Chip label={`${appointments.length} bookings`} size="small" variant="outlined"
                  sx={{ borderColor: 'var(--color-green)', color: 'var(--color-green)', fontSize: 12 }} />
              </div>
              {appointments.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  No appointments scheduled for today.
                </Typography>
              ) : (
                <Box className="dd-schedule-grid">
                  {appointments.map((appointment, index) => (
                    <Paper key={appointment.id} className="dd-schedule-item" elevation={0}>
                      <Box className="dd-schedule-item-head">
                        <Avatar className={index === 0 ? 'dd-list-avatar-green' : 'dd-list-avatar-blue'}>
                          {appointment.patientName?.charAt(0) || 'P'}
                        </Avatar>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, ml: 1, lineHeight: 1.2 }}>
                          {appointment.patientName}
                        </Typography>
                      </Box>

                      <Box className="dd-schedule-item-main">
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 }}>
                          {appointment.time} - {appointment.location}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                          {appointment.reason}
                        </Typography>
                      </Box>

                      <Box className="dd-schedule-item-footer">
                        <FormControl size="small" sx={{ width: '100%' }}>
                          <InputLabel id={`priority-label-${appointment.id}`}>Priority</InputLabel>
                          <Select
                            labelId={`priority-label-${appointment.id}`}
                            value={appointment.priority}
                            label="Priority"
                            onChange={(e) => handleUpdateAppointmentPriority(appointment.id, e.target.value)}
                            sx={{ fontSize: 12, height: 34 }}
                          >
                            <MenuItem value="Low">Low</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                          </Select>
                        </FormControl>
                        <Chip
                          label={appointment.priority}
                          color={appointment.priority === 'Medium' ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600, minWidth: 64 }}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Box>
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
      <Dialog open={patientDialogOpen} onClose={() => { setPatientDialogOpen(false); setPatientData(null); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography className="dd-dialog-title">Patient Medicard</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingPatientData ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress sx={{ color: 'var(--color-green)' }} />
            </Box>
          ) : patientData ? (
            <Box display="flex" justifyContent="center">
              <EmergencyCard
                dashboardData={patientData}
                emergencyQrPayload={emergencyQrPayload}
              />
            </Box>
          ) : (
            <Typography variant="body2">Unable to load patient medicard.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button className="dd-btn-outline-blue" variant="outlined" onClick={() => setPatientDialogOpen(false)}>
            Close
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

      {/* ---- AI Chat Dialog ---- */}
      <Dialog 
        open={chatDialogOpen} 
        onClose={handleCloseChat} 
        maxWidth="md" 
        fullWidth
        sx={{ 
          '& .MuiDialog-paper': { 
            height: '80vh', 
            borderRadius: '25px',
            animation: 'dialogSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          } 
        }}
        TransitionProps={{
          style: {
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, var(--color-green) 0%, #059669 100%)', color: 'white', padding: '24px !important', borderRadius: '16px 16px 0 0 !important', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chat sx={{ fontSize: 24 }} />
          <Typography sx={{ fontSize: '18px !important', fontWeight: '600 !important', flex: 1 }}>AI Medical Assistant</Typography>
          <IconButton onClick={handleCloseChat} sx={{ minWidth: 'auto', p: 0.5, color: 'white', '&:hover': { background: 'rgba(255,255,255,0.2)' } }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, gap: 0, background: '#FAFBFC' }}>
          <Box sx={{ flex: 1, overflow: 'auto', mb: 0, p: '16px', background: '#FAFBFC' }}>
            {chatMessages.length === 0 ? (
              <Box sx={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                <Chat sx={{ fontSize: 48, color: 'var(--color-green)', opacity: 0.3, mb: 2 }} />
                <Typography variant="body2">
                  Ask me anything about patient medical records, treatment plans, or clinical questions.
                  {selectedPatient && ` Currently analyzing: ${selectedPatient.name}`}
                </Typography>
              </Box>
            ) : (
              chatMessages.map((message, index) => (
                <Box key={index} sx={{ mb: 2, display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start', gap: 1, alignItems: 'flex-end' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: message.type === 'user' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <Chip
                      label={message.type === 'user' ? 'You' : 'AI Assistant'}
                      size="small"
                      color={message.type === 'user' ? 'primary' : 'success'}
                      variant="outlined"
                      sx={{ mb: 0.5, fontSize: '11px !important' }}
                    />
                    <Paper 
                      sx={{ 
                        p: '12px 16px', 
                        borderRadius: message.type === 'user' ? '16px 4px 16px 16px' : '16px 16px 4px 16px',
                        background: message.type === 'user' ? 'linear-gradient(135deg, var(--color-green) 0%, #059669 100%)' : 'white',
                        color: message.type === 'user' ? 'white' : 'var(--color-text)',
                        border: message.type === 'user' ? 'none' : '1px solid var(--color-border)',
                        boxShadow: message.type === 'user' ? '0 2px 8px rgba(22, 163, 74, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.06)'
                      }}
                      elevation={0}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                        {message.text}
                      </Typography>
                      {message.files && message.files.length > 0 && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: message.type === 'user' ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--color-border)' }}>
                          <Typography variant="caption" sx={{ opacity: 0.85, fontStyle: 'italic' }}>
                            📎 {message.files.map(f => f.name).join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>
              ))
            )}
            {chatLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: 'var(--color-green)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: 'var(--color-green)',
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                  }} />
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: 'var(--color-green)',
                    animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                  }} />
                  <Typography variant="body2" sx={{ ml: 1, color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    Analyzing...
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          
          {/* File Upload Section */}
          {uploadedFiles.length > 0 && (
            <Box sx={{ background: 'white', borderTop: '1px solid var(--color-border)', p: '12px 16px' }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'var(--color-text)', fontSize: '13px' }}>
                📎 Uploaded Files ({uploadedFiles.length}/20):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {uploadedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`}
                    onDelete={() => handleRemoveFile(index)}
                    size="small"
                    sx={{
                      background: 'var(--color-green-light)',
                      border: '1px solid var(--color-green)',
                      color: 'var(--color-green)',
                      fontSize: '12px !important',
                      '& .MuiChip-deleteIcon': { color: 'var(--color-green) !important' }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Chat Input Area */}
          <Box sx={{ background: 'white', borderTop: '1px solid var(--color-border)', p: '16px', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <input
              accept="*/*"
              style={{ display: 'none' }}
              id="file-upload"
              multiple
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload" style={{ display: 'flex' }}>
              <IconButton 
                component="span" 
                sx={{ 
                  color: uploadedFiles.length >= 20 ? '#D1D5DB' : 'var(--color-text-secondary)',
                  '&:hover': { background: uploadedFiles.length >= 20 ? 'transparent' : 'var(--color-green-light)', color: uploadedFiles.length >= 20 ? '#D1D5DB' : 'var(--color-green)' },
                  borderRadius: '10px',
                  width: 44,
                  height: 44,
                  p: 0
                }}
                disabled={uploadedFiles.length >= 20}
              >
                <AttachFile />
              </IconButton>
            </label>
            <TextField
              fullWidth
              placeholder="Ask about patient history, upload reports, or request clinical analysis..."
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
              disabled={chatLoading}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px !important',
                  background: 'white',
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendChatMessage}
              disabled={(!chatQuestion.trim() && uploadedFiles.length === 0) || chatLoading}
              sx={{ 
                minWidth: 'auto', 
                px: 0,
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: (!chatQuestion.trim() && uploadedFiles.length === 0) || chatLoading ? '#D1D5DB' : 'var(--color-green)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  background: (!chatQuestion.trim() && uploadedFiles.length === 0) || chatLoading ? '#D1D5DB' : 'var(--color-green-hover)',
                  transform: (!chatQuestion.trim() && uploadedFiles.length === 0) || chatLoading ? 'none' : 'scale(1.05)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Send />
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ---- Floating Chat Button ---- */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleOpenChat}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, var(--color-green) 0%, #059669 100%)',
          color: 'white',
          width: 64,
          height: 64,
          fontSize: 28,
          boxShadow: '0 8px 24px rgba(22, 163, 74, 0.35)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 1000,
          '&:hover': {
            transform: 'scale(1.15) translateY(-4px)',
            boxShadow: '0 12px 32px rgba(22, 163, 74, 0.5)'
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <Chat sx={{ fontSize: 28 }} />
      </Fab>
    </div>
  );
}

export default DoctorDashboard;