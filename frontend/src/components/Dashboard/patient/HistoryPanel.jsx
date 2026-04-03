import React from 'react';
import {
  Grid, Paper, Typography, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Button, Box
} from '@mui/material';
// replaced icon usage with emojis to avoid @mui/icons-material package issues

export default function HistoryPanel({ prescriptions, medicalRecords, handleFileDownload }) {
  return (
    <Grid container spacing={3}>

      {/* ---- Current Summary ---- */}
      <Grid item xs={12}>
        <Paper className="pd-card" elevation={0}>
          <div className="pd-card-header">
            <div>
              <Typography className="pd-card-title">Current Summary</Typography>
              <Typography className="pd-card-sub">Your active medications and medical summary</Typography>
            </div>
          </div>

          <TableContainer className="pd-table-wrap">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Dosage</TableCell>
                  <TableCell>Prescribed By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prescriptions.map((prescription, idx) => (
                  <TableRow key={prescription.id || idx}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 32, height: 32, borderRadius: '8px',
                            background: '#F3E8FF', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}
                        >
                          💊
                        </Box>
                        {prescription.medicine}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {prescription.dosage}
                      {prescription.frequency ? `, ${prescription.frequency}` : ''}
                    </TableCell>
                    <TableCell>{prescription.prescribedBy}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        className="pd-btn-outline"
                        sx={{ fontSize: '12px !important', padding: '4px 10px !important' }}
                      >
                        Request Refill
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {prescriptions.length === 0 && (
                  <TableRow className="pd-empty-row">
                    <TableCell colSpan={4}>No prescriptions on record</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* ---- Medical Records ---- */}
      <Grid item xs={12} md={6}>
        <Paper className="pd-card" elevation={0}>
          <div className="pd-card-header">
            <div>
              <Typography className="pd-card-title">Medical Records</Typography>
              <Typography className="pd-card-sub">View and download your medical history</Typography>
            </div>
          </div>

          <TableContainer className="pd-table-wrap">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {medicalRecords.map((record, idx) => (
                  <TableRow key={record.id || idx}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        📅
                        {record.date}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <span className={`pd-badge ${getTypeBadgeClass(record.type)}`}>
                        {record.type}
                      </span>
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell align="right">
                      <button
                        className="pd-btn-icon"
                        onClick={() => handleFileDownload && handleFileDownload(record.id, record.description)}
                        type="button"
                      >
                        ⬇️
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {medicalRecords.length === 0 && (
                  <TableRow className="pd-empty-row">
                    <TableCell colSpan={4}>No medical records found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

    </Grid>
  );
}

function getTypeBadgeClass(type) {
  const map = {
    'Checkup': 'pd-badge-blue',
    'Lab Report': 'pd-badge-purple',
    'Imaging': 'pd-badge-green',
    'Consultation': 'pd-badge-yellow',
    'Vaccination': 'pd-badge-red',
  };
  return map[type] || 'pd-badge-blue';
}