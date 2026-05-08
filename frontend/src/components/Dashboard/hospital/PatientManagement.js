import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Button,
  TextField,
  Grid
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchPatientId, setSearchPatientId] = useState('');
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Report upload states
  const [reports, setReports] = useState([]);
  const [reportFile, setReportFile] = useState(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/hospital/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Fetched patients response:', data);
      
      if (data.ok) {
        console.log('Patients count:', data.patients.length);
        data.patients.forEach(p => {
          console.log(`Patient: ${p.fullName}, Hospital: ${p.hospital}, AddedByHospital: ${p.addedByHospital}`);
        });
        setPatients(data.patients);
        setFilteredPatients(data.patients);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch patients');
      }
    } catch (error) {
      setError('Failed to fetch patients');
      console.error('Fetch patients error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phoneNumber.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const handleViewPatient = (patient) => {
    console.log('Viewing patient:', patient);
    console.log('Patient hospital field:', patient.hospital);
    setSelectedPatient(patient);
    setReports([]);
    setReportFile(null);
    setReportMessage('');
    fetchReports(patient._id);
    setOpenViewDialog(true);
  };

  const fetchReports = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:5000/api';
      console.log('Fetching reports for patient:', patientId);
      
      const response = await fetch(`${apiUrl}/hospital/patients/${patientId}/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Fetch reports response status:', response.status);
      const data = await response.json();
      console.log('Fetch reports response data:', data);
      
      if (response.status === 403) {
        console.error('Permission denied to view reports');
        setReportMessage('Permission denied - patient may not be assigned to your hospital');
        return [];
      }

      if (data.ok) {
        console.log('Setting reports, array length:', data.reports?.length || 0);
        setReports(data.reports || []);
        console.log('Reports set:', data.reports);
        return data.reports;
      } else {
        console.error('Fetch reports error:', data.message);
        setReportMessage(data.message || 'Error loading reports');
        return [];
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
      setReportMessage('Error loading reports: ' + err.message);
      return [];
    }
  };

  const handleUploadReport = async () => {
    if (!reportFile) {
      setReportMessage('Please select a file to upload');
      return;
    }

    if (!selectedPatient) {
      setReportMessage('No patient selected');
      return;
    }

    setIsUploadingReport(true);
    setReportMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:5000/api';
      const formData = new FormData();
      formData.append('report', reportFile);

      console.log('Uploading report for patient:', selectedPatient._id);
      console.log('File:', reportFile.name, reportFile.size);

      const response = await fetch(`${apiUrl}/hospital/patients/${selectedPatient._id}/upload-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Invalid response from server: ${response.statusText}`);
      }

      console.log('Upload response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }

      if (data.ok) {
        setReportMessage('Report uploaded successfully!');
        setReportFile(null);
        document.getElementById('report-file-input').value = '';
        // Wait a bit for backend to fully commit, then fetch reports
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchReports(selectedPatient._id);
        setReportMessage('');
      } else {
        throw new Error(data.message || 'Error uploading report');
      }
    } catch (error) {
      console.error('Upload report error:', error);
      setReportMessage('Error: ' + error.message);
    } finally {
      setIsUploadingReport(false);
    }
  };

  const handleDeleteReport = async (reportIndex) => {
    if (!selectedPatient) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/hospital/patients/${selectedPatient._id}/reports/${reportIndex}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.ok) {
        fetchReports(selectedPatient._id);
        setReportMessage('Report deleted successfully');
        setTimeout(() => setReportMessage(''), 2000);
      } else {
        setReportMessage(data.message || 'Error deleting report');
      }
    } catch (error) {
      setReportMessage('Error deleting report');
      console.error('Delete report error:', error);
    }
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedPatient(null);
  };

  const handleOpenAddDialog = () => {
    setSearchPatientId('');
    setSearchedPatient(null);
    setSearchError('');
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setSearchPatientId('');
    setSearchedPatient(null);
    setSearchError('');
  };

  const handleSearchPatient = async () => {
    if (!searchPatientId.trim()) {
      setSearchError('Please enter Patient ID or Email');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/hospital/patients/search/${encodeURIComponent(searchPatientId.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.ok) {
        setSearchedPatient(data.patient);
        setSearchError('');
      } else {
        setSearchedPatient(null);
        setSearchError(data.message || 'Patient not found');
      }
    } catch (error) {
      setSearchedPatient(null);
      setSearchError('Failed to search for patient');
      console.error('Search patient error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSearchedPatient = async () => {
    if (!searchedPatient) {
      setSearchError('No patient selected');
      return;
    }

    console.log('Adding patient to hospital:', searchedPatient);
    setIsAdding(true);
    setSearchError('');
    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/hospital/patients/add/${searchedPatient._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Add patient response:', data);
      
      if (data.ok) {
        console.log('Patient added successfully. Hospital ID:', data.patient?.hospital);
        setSearchError('');
        setTimeout(() => {
          console.log('Refreshing patient list...');
          fetchPatients();
          handleCloseAddDialog();
        }, 1500);
      } else {
        setSearchError(data.message || 'Error adding patient');
      }
    } catch (error) {
      setSearchError('Failed to add patient');
      console.error('Add patient error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)' }}>
            Patient Management
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'var(--color-text-muted)', mt: 0.5 }}>
            Manage patients added to your hospital
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{
            background: 'var(--color-primary)', color: 'white', borderRadius: '8px',
            fontSize: 14, fontWeight: 500, textTransform: 'none', boxShadow: 'none',
            padding: '8px 16px',
            '&:hover': { background: 'var(--color-primary-hover)', boxShadow: 'none' }
          }}
        >
          Add New Patient
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <TextField
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'var(--color-text-muted)' }} />
          }}
          size="small"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              borderColor: 'var(--color-border)'
            }
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}

      {filteredPatients.length === 0 ? (
        <Paper elevation={0} sx={{ 
          border: '1px solid var(--color-border)', 
          borderRadius: '10px', 
          padding: '40px',
          textAlign: 'center'
        }}>
          <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {patients.length === 0 
              ? 'No patients added yet. Click "Add New Patient" to get started.'
              : 'No patients match your search.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer 
          className="hd-table-wrap" 
          component={Paper} 
          elevation={0}
          sx={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600, color: 'var(--color-text)' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--color-text)' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--color-text)' }}>Age</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--color-text)' }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--color-text)' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--color-text)' }}>Blood Group</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'var(--color-text)' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient._id} sx={{ borderBottom: '1px solid var(--color-border)' }}>
                  <TableCell sx={{ color: 'var(--color-text)', fontSize: 14 }}>
                    {patient.fullName}
                  </TableCell>
                  <TableCell sx={{ color: 'var(--color-text)', fontSize: 14 }}>
                    {patient.email}
                  </TableCell>
                  <TableCell sx={{ color: 'var(--color-text)', fontSize: 14 }}>
                    {getAge(patient.dateOfBirth)} years
                  </TableCell>
                  <TableCell sx={{ color: 'var(--color-text)', fontSize: 14 }}>
                    <Chip 
                      label={patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                      size="small"
                      sx={{ 
                        background: patient.gender === 'male' ? '#e3f2fd' : '#fce4ec',
                        color: patient.gender === 'male' ? '#1976d2' : '#c2185b'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'var(--color-text)', fontSize: 14 }}>
                    {patient.phoneNumber}
                  </TableCell>
                  <TableCell sx={{ color: 'var(--color-text)', fontSize: 14 }}>
                    <Chip 
                      label={patient.bloodGroup || 'N/A'}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewPatient(patient)}
                      sx={{ color: 'var(--color-primary)' }}
                      title="View Details"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Patient Details Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'var(--color-primary)', 
          color: 'white',
          fontWeight: 600
        }}>
          Patient Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedPatient && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                  Full Name
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  {selectedPatient.fullName}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                  Email
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  {selectedPatient.email}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                  Date of Birth
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  {formatDate(selectedPatient.dateOfBirth)} ({getAge(selectedPatient.dateOfBirth)} years old)
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                  Gender
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  {selectedPatient.gender?.charAt(0).toUpperCase() + selectedPatient.gender?.slice(1)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                  Blood Group
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  {selectedPatient.bloodGroup || 'Not specified'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                  Phone Number
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  {selectedPatient.phoneNumber}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                  Address
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  {selectedPatient.address ? 
                    `${selectedPatient.address.street}, ${selectedPatient.address.city}, ${selectedPatient.address.state} ${selectedPatient.address.zipCode}`
                    : 'Not provided'
                  }
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                  Registered On
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  {formatDate(selectedPatient.createdAt)}
                </Typography>
              </Box>

              {/* Reports Upload Section */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid var(--color-border)' }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', mb: 2 }}>
                  Medical Reports
                </Typography>

                {reportMessage && (
                  <Alert severity={reportMessage.includes('Error') || reportMessage.includes('Please') ? 'error' : 'success'} sx={{ mb: 2, borderRadius: '8px' }}>
                    {reportMessage}
                  </Alert>
                )}

                {/* Upload Report Form */}
                <Box sx={{ mb: 3, p: 2, background: '#f5f5f5', borderRadius: '8px' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', mb: 1 }}>
                    Upload New Report
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      id="report-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setReportFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => document.getElementById('report-file-input').click()}
                      sx={{
                        color: 'var(--color-primary)',
                        borderColor: 'var(--color-primary)',
                        textTransform: 'none',
                        flex: 1
                      }}
                    >
                      {reportFile ? reportFile.name : 'Choose File'}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleUploadReport}
                      disabled={isUploadingReport || !reportFile}
                      sx={{
                        background: 'var(--color-primary)',
                        textTransform: 'none'
                      }}
                    >
                      {isUploadingReport ? 'Uploading...' : 'Upload'}
                    </Button>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: 'var(--color-text-muted)', mt: 1 }}>
                    Supported: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB)
                  </Typography>
                </Box>

                {/* Reports List */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', mb: 1 }}>
                    Uploaded Reports ({reports.length})
                  </Typography>
                  {reports.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: 'var(--color-text-muted)', p: 1 }}>
                      No reports uploaded yet
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {reports.map((report, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            mb: 1,
                            background: '#f9f9f9',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px'
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {report.originalName}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {formatDate(report.uploadDate)} • {(report.fileSize / 1024).toFixed(2)} KB
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleDeleteReport(index)}
                            sx={{
                              color: '#d32f2f',
                              textTransform: 'none',
                              fontSize: 11,
                              minWidth: 'auto',
                              padding: '4px 8px'
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseViewDialog} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add New Patient Dialog */}
      <Dialog 
        open={openAddDialog} 
        onClose={handleCloseAddDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'var(--color-primary)', 
          color: 'white',
          fontWeight: 600
        }}>
          Add Existing Patient
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {searchError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{searchError}</Alert>}
          
          {!searchedPatient ? (
            <Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Patient ID or Email"
                  placeholder="Enter patient ID or email address"
                  value={searchPatientId}
                  onChange={(e) => setSearchPatientId(e.target.value)}
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isSearching) {
                      handleSearchPatient();
                    }
                  }}
                  helperText="Search for an existing patient by their ID or email address"
                />
              </Box>

              <Button 
                fullWidth
                variant="contained"
                onClick={handleSearchPatient}
                disabled={isSearching || !searchPatientId.trim()}
                sx={{ background: 'var(--color-primary)' }}
              >
                {isSearching ? 'Searching...' : 'Search Patient'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
                Patient found! Click "Add Patient" to add them to your hospital.
              </Alert>

              <Box sx={{ background: '#f5f5f5', p: 2, borderRadius: '8px', mb: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Full Name
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
                    {searchedPatient.fullName}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Email
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: 'var(--color-text)' }}>
                    {searchedPatient.email}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Age
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: 'var(--color-text)' }}>
                    {getAge(searchedPatient.dateOfBirth)} years
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Gender
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: 'var(--color-text)' }}>
                    {searchedPatient.gender?.charAt(0).toUpperCase() + searchedPatient.gender?.slice(1)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Phone
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: 'var(--color-text)' }}>
                    {searchedPatient.phoneNumber}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Blood Group
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: 'var(--color-text)' }}>
                    {searchedPatient.bloodGroup || 'Not specified'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSearchedPatient(null);
                    setSearchPatientId('');
                  }}
                  disabled={isAdding}
                >
                  Search Another
                </Button>
                <Button 
                  fullWidth
                  variant="contained"
                  onClick={handleAddSearchedPatient}
                  disabled={isAdding}
                  sx={{ background: 'var(--color-primary)' }}
                >
                  {isAdding ? 'Adding...' : 'Add Patient'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PatientManagement;
