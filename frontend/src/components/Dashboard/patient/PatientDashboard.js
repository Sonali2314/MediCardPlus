import React, { useState, useEffect, useRef } from 'react';
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
  Button,
  IconButton,
  Alert
  , Tabs, Tab
} from '@mui/material';
import { Avatar, Divider } from '@mui/material';
import {
  MedicalServices,
  DownloadForOffline,
  CloudUpload,
  FilePresent
} from '@mui/icons-material';
import { Person, Description, History } from '@mui/icons-material';
import { toPng } from 'html-to-image';
import dashboardService from '../../../services/dashboardService';
import './PatientDashboard.css';
import SettingsForm from './SettingsForm';
import MedicardPanel from './MedicardPanel';
import HistoryPanel from './HistoryPanel';

function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [cardError, setCardError] = useState(null);
  const [cardDownloading, setCardDownloading] = useState(false);
  const cardRef = useRef(null);

  const [formState, setFormState] = useState({});
  const [, setFormErrors] = useState({});

  useEffect(() => {
    if (!dashboardData) return;
    setFormState({
      fullName: dashboardData.fullName || '',
      email: dashboardData.email || '',
      phoneNumber: dashboardData.phoneNumber || '',
      dateOfBirth: dashboardData.dateOfBirth ? new Date(dashboardData.dateOfBirth).toISOString().slice(0,10) : '',
      gender: dashboardData.gender || '',
      bloodGroup: dashboardData.bloodGroup || '',
      address: dashboardData.address || {}
    });
    setFormErrors({});
  }, [dashboardData]);

  // Inline editing/autosave removed from this view; keep simple read-only profile + settings panel

  useEffect(() => {
    let isMounted = true;
    const pollingIntervalMs = Number(process.env.REACT_APP_DASHBOARD_POLL_MS) || 10000;
    const wsUrl = process.env.REACT_APP_WS_URL || null;
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    const fetchDashboardData = async (initial = false) => {
      if (!user || !token) {
        if (isMounted) setError('User not authenticated');
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await dashboardService.getPatientDashboard(user.id, token);
        const data = response.data || response;
        if (!isMounted) return;
        setDashboardData(data || null);
        setReports(data.reports || []);
        setPrescriptions(data.prescriptions || []);
        setMedicalRecords(data.medicalRecords || []);
        if (initial) setLoading(false);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load dashboard');
        if (initial && isMounted) setLoading(false);
      }
    };

    fetchDashboardData(true);

    const wsRef = { current: null };
    if (wsUrl && user && token) {
      try {
        const connectUrl = wsUrl;
        const ws = new WebSocket(connectUrl);
        wsRef.current = ws;

        ws.addEventListener('open', () => {
          try {
            ws.send(JSON.stringify({ type: 'authenticate', token, role: 'patient', id: user.id }));
          } catch (e) {}
        });

        ws.addEventListener('message', (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg && msg.type === 'dashboard-update' && msg.data) {
              if (!isMounted) return;
              setDashboardData(msg.data);
              setReports(msg.data.reports || []);
              setPrescriptions(msg.data.prescriptions || []);
              setMedicalRecords(msg.data.medicalRecords || []);
            }
          } catch (e) {}
        });

        ws.addEventListener('error', () => {
          if (wsRef.current) {
            try { wsRef.current.close(); } catch (_) {}
            wsRef.current = null;
          }
        });
      } catch (e) {}
    }

    const pollId = setInterval(() => {
      if (!wsRef.current) fetchDashboardData(false);
    }, pollingIntervalMs);

    return () => {
      isMounted = false;
      try { clearInterval(pollId); } catch (_) {}
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (_) {}
        wsRef.current = null;
      }
    };
  }, []);

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await dashboardService.uploadReport(uploadFile, token);

      setUploadSuccess('Report uploaded successfully!');
      setUploadFile(null);

      const user = JSON.parse(localStorage.getItem('user'));
      const updatedResponse = await dashboardService.getPatientDashboard(user.id, token);
      const updatedData = updatedResponse.data || updatedResponse;
      setReports(updatedData.reports || []);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileDownload = async (reportId, originalName) => {
    try {
      const token = localStorage.getItem('token');
      const blob = await dashboardService.downloadReport(reportId, token);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download report: ' + error.message);
    }
  };

  const handleDownloadEmergencyCard = async () => {
    if (!cardRef.current) return;

    setCardError(null);
    setCardDownloading(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: window.devicePixelRatio || 2,
        quality: 1
      });

      const link = document.createElement('a');
      const safeName = dashboardData.fullName ? dashboardData.fullName.replace(/\s+/g, '_') : 'patient';
      link.download = `${safeName}_medicard.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Emergency card download error:', err);
      setCardError('Unable to download emergency card. Please try again.');
    } finally {
      setCardDownloading(false);
    }
  };

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

  const emergencyQrPayload = JSON.stringify({
    id: dashboardData._id,
    name: dashboardData.fullName,
    bloodGroup: dashboardData.bloodGroup || 'Unknown',
    phone: dashboardData.phoneNumber,
    emergencyNote: 'For emergency use only'
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="profile" label="Profile" icon={<Person />} iconPosition="start" />
          <Tab value="documents" label="Documents" icon={<Description />} iconPosition="start" />
          <Tab value="history" label="History" icon={<History />} iconPosition="start" />
          <Tab value="medicard" label="Medicard" icon={<FilePresent />} iconPosition="start" />
          <Tab value="settings" label="Profile Settings" icon={<Person />} iconPosition="start" />
        </Tabs>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">
        {/* Main Content (full width) */}
        <Grid item xs={12} md={12}>
          {activeTab === 'profile' && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 96, height: 96 }} src={dashboardData?.avatarUrl || ''}>
                  {dashboardData?.fullName ? dashboardData.fullName.charAt(0) : 'P'}
                </Avatar>
                <Box>
                  <Typography variant="h6">{dashboardData?.fullName || 'Patient'}</Typography>
                  <Typography variant="body2" color="textSecondary">#{dashboardData?._id?.slice(-5) || '—'}</Typography>
                </Box>
              </Box>
              <Typography variant="h5" gutterBottom>Patient Profile</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Patient ID</Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{dashboardData._id}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Full Name</Typography>
                  <Typography variant="body1">{dashboardData.fullName || 'N/A'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Date of Birth</Typography>
                  <Typography variant="body1">{dashboardData.dateOfBirth ? new Date(dashboardData.dateOfBirth).toLocaleDateString() : 'N/A'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Gender</Typography>
                  <Typography variant="body1">{dashboardData.gender || 'N/A'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Blood Group</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>{dashboardData.bloodGroup || 'Unknown'}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Phone</Typography>
                  <Typography variant="body1">{dashboardData.phoneNumber || 'N/A'}</Typography>
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Divider sx={{ my: 1 }} />
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="textSecondary">Email</Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{dashboardData.email || 'N/A'}</Typography>
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="textSecondary">Address</Typography>
                  <Typography variant="body1">{(dashboardData.address && (dashboardData.address.line1 || dashboardData.address.city)) ? `${dashboardData.address.line1 || ''}${dashboardData.address.city ? ', ' + dashboardData.address.city : ''}${dashboardData.address.state ? ', ' + dashboardData.address.state : ''}${dashboardData.address.zip ? ' - ' + dashboardData.address.zip : ''}` : 'N/A'}</Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* MEDICARD TAB */}
          {activeTab === 'medicard' && (
              <MedicardPanel
                emergencyCardRef={cardRef}
                dashboardData={dashboardData}
                handleDownloadEmergencyCard={handleDownloadEmergencyCard}
                cardError={cardError}
                cardDownloading={cardDownloading}
                setCardError={setCardError}
                emergencyQrPayload={emergencyQrPayload}
              />
          )}

          {/* PROFILE SETTINGS TAB */}
          {activeTab === 'settings' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <SettingsForm dashboardData={dashboardData} onUpdate={(updated) => setDashboardData(updated)} />
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Upload Medical Report</Typography>
                  {uploadError && (<Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>)}
                  {uploadSuccess && (<Alert severity="success" sx={{ mb: 2 }}>{uploadSuccess}</Alert>)}
                  <Box display="flex" alignItems="center" gap={2}>
                    <input
                      id="report-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      style={{ flex: 1 }}
                    />
                    <Button variant="contained" color="primary" startIcon={<CloudUpload />} onClick={handleFileUpload} disabled={!uploadFile || uploadLoading}>
                      {uploadLoading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </Box>
                  {uploadFile && (
                    <Typography variant="body2" sx={{ mt: 1 }}>{uploadFile.name} ({(uploadFile.size/1024).toFixed(1)} KB)</Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>My Medical Reports</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>File Name</TableCell>
                          <TableCell>Upload Date</TableCell>
                          <TableCell>File Size</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report._id}>
                            <TableCell>{report.originalName}</TableCell>
                            <TableCell>{new Date(report.uploadDate).toLocaleDateString()}</TableCell>
                            <TableCell>{(report.fileSize / 1024).toFixed(2)} KB</TableCell>
                            <TableCell align="right">
                              <IconButton color="primary" onClick={() => handleFileDownload(report._id, report.originalName)} size="small">
                                <DownloadForOffline />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {reports.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">No reports uploaded yet</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
              <HistoryPanel
                prescriptions={prescriptions}
                medicalRecords={medicalRecords}
              />
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default PatientDashboard;
