import React, { useState, useEffect } from 'react';
import { Grid, TextField, Button, Box, Typography, Alert } from '@mui/material';
import dashboardService from '../../../services/dashboardService';

export default function SettingsForm({ dashboardData, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (!dashboardData) return;
    setForm({
      fullName: dashboardData.fullName || '',
      email: dashboardData.email || '',
      phoneNumber: dashboardData.phoneNumber || '',
      dateOfBirth: dashboardData.dateOfBirth ? new Date(dashboardData.dateOfBirth).toISOString().slice(0,10) : '',
      gender: dashboardData.gender || '',
      bloodGroup: dashboardData.bloodGroup || '',
      address: dashboardData.address || {}
    });
    setErrors({});
    setServerError(null);
    setEditing(false);
  }, [dashboardData]);

  const validate = (state) => {
    const e = {};
    if (!state.fullName || state.fullName.trim().length < 2) e.fullName = 'Full name is required';
    if (!state.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)) e.email = 'Valid email is required';
    if (!state.phoneNumber || state.phoneNumber.trim().length < 7) e.phoneNumber = 'Valid phone is required';
    if (!state.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setServerError(null);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      if (!user || !token) throw new Error('Not authenticated');

      const payload = { ...form };
      const updated = await dashboardService.updatePatientProfile(user.id, payload, token);
      onUpdate(updated.data || updated);
      setEditing(false);
    } catch (err) {
      setServerError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      fullName: dashboardData.fullName || '',
      email: dashboardData.email || '',
      phoneNumber: dashboardData.phoneNumber || '',
      dateOfBirth: dashboardData.dateOfBirth ? new Date(dashboardData.dateOfBirth).toISOString().slice(0,10) : '',
      gender: dashboardData.gender || '',
      bloodGroup: dashboardData.bloodGroup || '',
      address: dashboardData.address || {}
    });
    setErrors({});
    setServerError(null);
    setEditing(false);
  };

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Profile Settings</Typography>
        {!editing ? (
          <Button variant="contained" onClick={() => setEditing(true)}>Edit</Button>
        ) : (
          <Box>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={saving} sx={{ mr: 1 }}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button variant="outlined" onClick={handleCancel}>Cancel</Button>
          </Box>
        )}
      </Box>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Full Name" value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} fullWidth required disabled={!editing} error={!!errors.fullName} helperText={errors.fullName} margin="normal" />
          <TextField label="Date of Birth" type="date" value={form.dateOfBirth || ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} fullWidth required disabled={!editing} InputLabelProps={{ shrink: true }} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth} margin="normal" />
          <TextField label="Gender" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })} fullWidth disabled={!editing} margin="normal" />
          <TextField label="Blood Group" value={form.bloodGroup || ''} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} fullWidth disabled={!editing} margin="normal" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth required disabled={!editing} error={!!errors.email} helperText={errors.email} margin="normal" />
          <TextField label="Phone Number" value={form.phoneNumber || ''} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} fullWidth required disabled={!editing} error={!!errors.phoneNumber} helperText={errors.phoneNumber} margin="normal" />
          <TextField label="Street Address" value={form.address?.street || ''} onChange={(e) => setForm({ ...form, address: { ...(form.address || {}), street: e.target.value } })} fullWidth disabled={!editing} margin="normal" />
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField label="City" value={form.address?.city || ''} onChange={(e) => setForm({ ...form, address: { ...(form.address || {}), city: e.target.value } })} fullWidth disabled={!editing} margin="normal" />
            </Grid>
            <Grid item xs={6}>
              <TextField label="State / ZIP" value={(form.address?.state || '') + (form.address?.zipCode ? ' ' + form.address.zipCode : '')} onChange={(e) => {
                const val = e.target.value;
                const parts = val.split(' ');
                const zip = parts.length > 1 ? parts.pop() : '';
                const state = parts.join(' ');
                setForm({ ...form, address: { ...(form.address || {}), state, zipCode: zip } });
              }} fullWidth disabled={!editing} margin="normal" />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
