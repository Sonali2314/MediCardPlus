import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const DEFAULT_DEPARTMENTS = [
  'Accident & Emergency (A&E) / Casualty',
  'Anesthesiology',
  'Cardiology (Heart)',
  'Dermatology (Skin)',
  'Endocrinology (Hormones)',
  'ENT (Ear, Nose, Throat)',
  'Gastroenterology (Digestive System)',
  'General Surgery',
  'Geriatrics (Elderly care)',
  'Hematology (Blood disorders)',
  'Infectious Diseases',
  'Intensive Care Unit (ICU)',
  'Maternity / Obstetrics and Gynecology',
  'Neurology (Brain and nervous system)',
  'Nephrology (Kidneys)',
  'Ophthalmology (Eyes)',
  'Oncology (Cancer)',
  'Orthopedics (Musculoskeletal system)',
  'Pathology (Lab analysis)',
  'Pediatrics (Children)',
  'Physical Medicine and Rehabilitation (Physiotherapy)',
  'Psychiatry (Mental health)',
  'Pulmonology (Lungs)',
  'Radiology (Diagnostic imaging like X-ray, MRI)',
  'Rheumatology (Autoimmune diseases)',
  'Urology (Urinary tract)',
  'other'
];

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    specialization: '',
    phoneNumber: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/hospital/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.ok) {
        setDoctors(data.doctors);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch doctors');
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/hospital/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.ok && data.departments) {
        const hospitalDepartments = data.departments.map(dept => dept.name);
        const allDepartments = [...new Set([...DEFAULT_DEPARTMENTS, ...hospitalDepartments])];
        setDepartments(allDepartments.sort());
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartments(DEFAULT_DEPARTMENTS);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setFormData({
      fullName: '',
      email: '',
      specialization: '',
      phoneNumber: '',
      department: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditDoctor = (doctor) => {
    setFormData({
      fullName: doctor.fullName,
      email: doctor.email,
      specialization: doctor.specialization,
      phoneNumber: doctor.phoneNumber,
      department: doctor.department || ''
    });
    setIsEditing(true);
    setEditingId(doctor._id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `/api/hospital/doctors/${editingId}`
        : '/api/hospital/doctors';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.ok) {
        if (isEditing) {
          setSuccess('Doctor updated successfully');
        } else {
          setSuccess(data.message || 'Doctor added successfully. Login credentials have been sent to their email.');
        }
        fetchDoctors();
        handleCloseDialog();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to process request');
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to remove this doctor?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/hospital/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.ok) {
        setSuccess('Doctor removed successfully');
        fetchDoctors();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to remove doctor');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)' }}>
            Doctor Management
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'var(--color-text-muted)', mt: 0.5 }}>
            Manage doctors assigned to your hospital
          </Typography>
        </div>
        <Button
          variant="contained"
          onClick={handleOpenDialog}
          sx={{
            background: 'var(--color-primary)', color: 'white', borderRadius: '8px',
            fontSize: 14, fontWeight: 500, textTransform: 'none', boxShadow: 'none',
            padding: '8px 16px',
            '&:hover': { background: 'var(--color-primary-hover)', boxShadow: 'none' }
          }}
        >
          + Add New Doctor
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{success}</Alert>}

      <TableContainer className="hd-table-wrap" component={Paper} elevation={0}
        sx={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center"
                  sx={{ py: 3, color: 'var(--color-text-muted)', fontSize: 14 }}>
                  No doctors added yet.
                </TableCell>
              </TableRow>
            )}
            {doctors.map((doctor) => (
              <TableRow key={doctor._id}>
                <TableCell sx={{ fontWeight: 500 }}>{doctor.fullName}</TableCell>
                <TableCell>{doctor.email}</TableCell>
                <TableCell>{doctor.specialization}</TableCell>
                <TableCell>{doctor.department || 'Not assigned'}</TableCell>
                <TableCell>{doctor.phoneNumber}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleEditDoctor(doctor)}
                    sx={{ color: 'var(--color-primary)', '&:hover': { background: 'var(--color-primary-light)' }, mr: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteDoctor(doctor._id)}
                    sx={{ color: '#EF4444', '&:hover': { background: '#FEF2F2' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Full Name"
              type="text"
              fullWidth
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Specialization"
              type="text"
              fullWidth
              required
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Phone Number"
              type="tel"
              fullWidth
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                label="Department"
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <MenuItem value="">Not assigned</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!isEditing && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 1 }}>
                A secure password will be automatically generated and sent to the doctor's email address.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {isEditing ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DoctorManagement;