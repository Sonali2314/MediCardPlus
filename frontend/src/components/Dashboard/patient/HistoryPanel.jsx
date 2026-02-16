import React from 'react';
import { Grid, Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button } from '@mui/material';
import { DownloadForOffline } from '@mui/icons-material';

export default function HistoryPanel({ prescriptions, medicalRecords, handleFileDownload }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Current Prescriptions</Typography>
          <TableContainer>
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
                    <TableCell>{prescription.medicine}</TableCell>
                    <TableCell>{prescription.dosage}{prescription.frequency ? `, ${prescription.frequency}` : ''}</TableCell>
                    <TableCell>{prescription.prescribedBy}</TableCell>
                    <TableCell align="right">
                      <Button variant="outlined" size="small" color="primary">Request Refill</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Medical Records</Typography>
          <TableContainer>
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
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" size="small"><DownloadForOffline /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
}
