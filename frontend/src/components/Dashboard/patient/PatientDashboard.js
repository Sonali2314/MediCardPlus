import React, { useState, useEffect, useRef } from 'react';
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
  IconButton,
  Alert,
  Tabs,
  Tab,
  Divider,
  Avatar
} from '@mui/material';
import {
  MedicalServices,
  DownloadForOffline,
  CloudUpload,
  FilePresent,
  Person,
  Description,
  History,
  Share
} from '@mui/icons-material';
import { toPng } from 'html-to-image';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../../services/dashboardService';
import './PatientDashboard.css';
import SettingsForm from './SettingsForm';
import MedicardPanel from './MedicardPanel';
import HistoryPanel from './HistoryPanel';

function PatientDashboard() {
  const navigate = useNavigate();
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
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.addEventListener('open', () => {
          try { ws.send(JSON.stringify({ type: 'authenticate', token, role: 'patient', id: user.id })); } catch (e) {}
        });
        ws.addEventListener('message', (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg?.type === 'dashboard-update' && msg.data) {
              if (!isMounted) return;
              setDashboardData(msg.data);
              setReports(msg.data.reports || []);
              setPrescriptions(msg.data.prescriptions || []);
              setMedicalRecords(msg.data.medicalRecords || []);
            }
          } catch (e) {}
        });
        ws.addEventListener('error', () => {
          if (wsRef.current) { try { wsRef.current.close(); } catch (_) {} wsRef.current = null; }
        });
      } catch (e) {}
    }

    const pollId = setInterval(() => { if (!wsRef.current) fetchDashboardData(false); }, pollingIntervalMs);

    return () => {
      isMounted = false;
      try { clearInterval(pollId); } catch (_) {}
      if (wsRef.current) { try { wsRef.current.close(); } catch (_) {} wsRef.current = null; }
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
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = 'medicard-emergency.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setCardError('Failed to generate card: ' + err.message);
    } finally {
      setCardDownloading(false);
    }
  };

  // ---- Loading / Error states ----
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

  const emergencyQrPayload = JSON.stringify({
    id: dashboardData._id,
    name: dashboardData.fullName,
    bloodGroup: dashboardData.bloodGroup || 'Unknown',
    phone: dashboardData.phoneNumber,
    emergencyNote: 'For emergency use only'
  });

  const initials = dashboardData?.fullName
    ? dashboardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P';

  const addressStr = dashboardData.address
    ? [dashboardData.address.line1, dashboardData.address.city, dashboardData.address.state, dashboardData.address.zip]
        .filter(Boolean).join(', ')
    : 'N/A';

  return (
    <div className="pd-page">
      {/* ---- Header ---- */}
      <header className="pd-header">
        <div className="pd-header-inner">
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

      {/* ---- Main content ---- */}
      <div className="pd-content">

        {/* ---- Patient Info Card ---- */}
        <Paper className="pd-info-card" elevation={0}>
          <div className="pd-info-card-inner">
            <div className="pd-info-left">
              <Avatar className="pd-avatar-wrap" src={dashboardData?.avatarUrl || ''}>
                {initials}
              </Avatar>
              <div>
                <Typography className="pd-patient-name">{dashboardData?.fullName || 'Patient'}</Typography>
                <div className="pd-patient-meta">
                  <span>ID: #{dashboardData?._id?.slice(-5) || '—'}</span>
                  {dashboardData?.bloodGroup && <span>Blood Group: {dashboardData.bloodGroup}</span>}
                  {dashboardData?.email && <span>{dashboardData.email}</span>}
                </div>
              </div>
            </div>
            <Button
              className="pd-btn-primary"
              variant="contained"
              startIcon={<Share sx={{ fontSize: 16 }} />}
            >
              Share Records
            </Button>
          </div>
        </Paper>

        {/* ---- Navigation Tabs ---- */}
        <Paper className="pd-tabs-card" elevation={0}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab value="profile"   label="Profile"          icon={<Person />}      iconPosition="start" />
            <Tab value="documents" label="Documents"        icon={<Description />} iconPosition="start" />
            <Tab value="history"   label="Summary of Records"          icon={<History />}     iconPosition="start" />
            <Tab value="medicard"  label="Medicard"         icon={<FilePresent />} iconPosition="start" />
            <Tab value="settings"  label="Profile Settings" icon={<Person />}      iconPosition="start" />
          </Tabs>
        </Paper>

        {/* ---- Tab Panels ---- */}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <Paper className="pd-card" elevation={0}>
            <div className="pd-card-header">
              <div>
                <Typography className="pd-card-title">Patient Profile</Typography>
                <Typography className="pd-card-sub">Your personal and medical information</Typography>
              </div>
            </div>

            <div className="pd-details-grid">
              <div className="pd-field">
                <span className="pd-field-label">Patient ID</span>
                <Typography className="pd-field-value" style={{ wordBreak: 'break-all' }}>{dashboardData._id}</Typography>
              </div>
              <div className="pd-field">
                <span className="pd-field-label">Full Name</span>
                <Typography className="pd-field-value">{dashboardData.fullName || 'N/A'}</Typography>
              </div>
              <div className="pd-field">
                <span className="pd-field-label">Date of Birth</span>
                <Typography className="pd-field-value">
                  {dashboardData.dateOfBirth ? new Date(dashboardData.dateOfBirth).toLocaleDateString() : 'N/A'}
                </Typography>
              </div>
              <div className="pd-field">
                <span className="pd-field-label">Gender</span>
                <Typography className="pd-field-value">{dashboardData.gender || 'N/A'}</Typography>
              </div>
              <div className="pd-field">
                <span className="pd-field-label">Blood Group</span>
                <Typography className="pd-field-value blood">{dashboardData.bloodGroup || 'Unknown'}</Typography>
              </div>
              <div className="pd-field">
                <span className="pd-field-label">Phone</span>
                <Typography className="pd-field-value">{dashboardData.phoneNumber || 'N/A'}</Typography>
              </div>
              <div className={`pd-field pd-field-full`}>
                <Divider sx={{ mb: 0 }} />
              </div>
              <div className="pd-field pd-field-full">
                <span className="pd-field-label">Email</span>
                <Typography className="pd-field-value" style={{ wordBreak: 'break-word' }}>{dashboardData.email || 'N/A'}</Typography>
              </div>
              <div className="pd-field pd-field-full">
                <span className="pd-field-label">Address</span>
                <Typography className="pd-field-value">{addressStr || 'N/A'}</Typography>
              </div>
            </div>
          </Paper>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <Grid container spacing={3}>
            {/* Upload */}
            <Grid item xs={12}>
              <Paper className="pd-card" elevation={0}>
                <div className="pd-card-header">
                  <div>
                    <Typography className="pd-card-title">Upload Medical Report</Typography>
                    <Typography className="pd-card-sub">Supported formats: PDF, DOC, JPG, PNG</Typography>
                  </div>
                  <Button
                    className="pd-btn-primary"
                    variant="contained"
                    startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
                    onClick={handleFileUpload}
                    disabled={!uploadFile || uploadLoading}
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>

                {uploadError && <Alert severity="error" className="pd-alert">{uploadError}</Alert>}
                {uploadSuccess && <Alert severity="success" className="pd-alert">{uploadSuccess}</Alert>}

                <div className="pd-upload-row">
                  <input
                    id="report-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                {uploadFile && (
                  <Typography className="pd-upload-hint">
                    {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Reports table */}
            <Grid item xs={12}>
              <Paper className="pd-card" elevation={0}>
                <div className="pd-card-header">
                  <div>
                    <Typography className="pd-card-title">My Medical Reports</Typography>
                    <Typography className="pd-card-sub">View and download your uploaded reports</Typography>
                  </div>
                </div>
                <TableContainer className="pd-table-wrap">
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
                            <IconButton
                              onClick={() => handleFileDownload(report._id, report.originalName)}
                              size="small"
                              sx={{ color: 'var(--color-primary)' }}
                            >
                              <DownloadForOffline />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {reports.length === 0 && (
                        <TableRow className="pd-empty-row">
                          <TableCell colSpan={4}>No reports uploaded yet</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <HistoryPanel
            prescriptions={prescriptions}
            medicalRecords={medicalRecords}
            handleFileDownload={handleFileDownload}
          />
        )}

        {/* MEDICARD */}
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

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <Paper className="pd-card" elevation={0}>
            <SettingsForm dashboardData={dashboardData} onUpdate={(updated) => setDashboardData(updated)} />
          </Paper>
        )}

      </div>
    </div>
  );
}

export default PatientDashboard;