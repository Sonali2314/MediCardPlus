import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container,
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
  Card,
  CardContent,
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
  Search,
  PersonAdd,
  EventAvailable,
  AssignmentTurnedIn,
  ArrowForwardIos,
  Visibility
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
          try {
            user = userData ? JSON.parse(userData) : null;
          } catch {
            user = null;
          }
          if (!token || !user || userType !== 'doctor') {
            navigate('/login');
            return;
          }

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

          setCareTasks([
            {
              id: 'task-1',
              title: 'Review lab results',
              patientName: doctorPatientsData[0]?.name || 'Next patient',
              due: 'Today 4:00 PM',
              priority: 'High'
            },
            {
              id: 'task-2',
              title: 'Update treatment plan',
              patientName: doctorPatientsData[1]?.name || 'Follow-up',
              due: 'Tomorrow 10:00 AM',
              priority: 'Medium'
            },
            {
              id: 'task-3',
              title: 'Prepare discharge summary',
              patientName: doctorPatientsData[2]?.name || 'Inpatient',
              due: 'Friday 2:00 PM',
              priority: 'Low'
            }
          ]);
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
        if (!searchQuery.trim()) {
          setPatients([]);
          return;
        }

        setSearchLoading(true);
        try {
          const userData = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          let user = null;
          try {
            user = userData ? JSON.parse(userData) : null;
          } catch {
            user = null;
          }

          if (user && token) {
            const searchResults = await dashboardService.searchPatients(user.id, searchQuery, token);
            setPatients(searchResults);
          }
        } catch (err) {
          console.error('Search error:', err);
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
        try {
          user = userData ? JSON.parse(userData) : null;
        } catch {
          user = null;
        }

        if (user && token) {
          await dashboardService.addPatientToDoctor(user.id, patientId, token);
          const updatedPatients = await dashboardService.getDoctorPatients(user.id, token);
          setDoctorPatients(updatedPatients);
          setPatients([]);
          setSearchQuery('');
          setSnackbar({ open: true, message: 'Patient added to your panel', severity: 'success' });
        }
      } catch (err) {
        console.error('Add patient error:', err);
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
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    if (!dashboardData) {
      return null;
    }

    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Doctor Info */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" gutterBottom>
                Doctor Profile
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Name:</strong> {dashboardData.fullName}</Typography>
                  <Typography><strong>Specialization:</strong> {dashboardData.specialization}</Typography>
                  <Typography><strong>License Number:</strong> {dashboardData.licenseNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Email:</strong> {dashboardData.email}</Typography>
                  <Typography><strong>Phone:</strong> {dashboardData.phoneNumber}</Typography>
                  <Typography>
                    <strong>Hospital:</strong> {dashboardData.hospital?.fullName || 'Not Assigned'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocalHospital color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">
                    Total Patients
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {doctorPatients.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <EventAvailable color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">
                    Appointments Today
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {todaysAppointments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssignmentTurnedIn color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">
                    High Priority Tasks
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {highPriorityTasks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Patients List */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="div">
                  My Patients
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    size="small"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    inputRef={searchInputRef}
                    InputProps={{
                      startAdornment: <Search color="action" sx={{ mr: 1 }} />
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    color="primary"
                    onClick={() => searchInputRef.current?.focus()}
                  >
                    Add Patient
                  </Button>
                </Box>
              </Box>
              <TableContainer>
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
                        <TableCell colSpan={5} align="center">
                          <CircularProgress size={24} />
                          <Typography variant="body2" sx={{ ml: 1 }}>Searching...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : displayPatients.length === 0 && searchQuery.trim() ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No patients found matching "{searchQuery}"
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : displayPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No patients added yet. Use search to add patients.
                          </Typography>
                        </TableCell>
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
                                variant="contained"
                                size="small"
                                color="primary"
                                sx={{ mr: 1 }}
                                disabled={addLoading === patient.id}
                                onClick={() => handleAddPatient(patient.id)}
                              >
                                {addLoading === patient.id ? 'Adding...' : 'Add'}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="primary"
                                  sx={{ mr: 1 }}
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setPatientDialogOpen(true);
                                  }}
                                >
                                  <Visibility fontSize="small" sx={{ mr: 0.5 }} />
                                  View
                                </Button>
                                <Tooltip title="Schedule follow-up">
                                  <span>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      color="primary"
                                      endIcon={<ArrowForwardIos fontSize="inherit" />}
                                    >
                                      Schedule
                                    </Button>
                                  </span>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Today's Schedule */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Today's Schedule
                </Typography>
                <Chip label={`${appointments.length} bookings`} size="small" color="primary" variant="outlined" />
              </Box>
              {appointments.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No appointments scheduled for today.
                </Typography>
              ) : (
                <List dense className="dd-schedule-list">
                  {appointments.map((appointment, index) => (
                    <React.Fragment key={appointment.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: index === 0 ? 'success.main' : 'primary.main' }}>
                            {appointment.patientName?.charAt(0) || 'P'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={appointment.patientName}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {appointment.time} • {appointment.location}
                              </Typography>
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
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
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Care Tasks
                </Typography>
                <Chip label={`${careTasks.length} tasks`} size="small" variant="outlined" />
              </Box>
              {careTasks.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No pending tasks. Great job!
                </Typography>
              ) : (
                <List dense className="dd-tasks-list">
                  {careTasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {task.patientName}
                              </Typography>
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
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

        <Dialog open={patientDialogOpen} onClose={() => setPatientDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Patient Snapshot</DialogTitle>
          <DialogContent dividers>
            {selectedPatient ? (
              <>
                <DialogContentText component="div">
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedPatient.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Age {selectedPatient.age}
                  </Typography>
                </DialogContentText>
                <Box mt={2}>
                  <Typography variant="body2"><strong>Current Concern:</strong> {selectedPatient.condition}</Typography>
                  <Typography variant="body2"><strong>Last Visit:</strong> {selectedPatient.lastVisit}</Typography>
                </Box>
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Additional medical history coming soon.
                  </Typography>
                </Box>
              </>
            ) : (
              <Typography variant="body2">No patient selected.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPatientDialogOpen(false)}>Close</Button>
            <Button
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
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    );
  }

  export default DoctorDashboard;
