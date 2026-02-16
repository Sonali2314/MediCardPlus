import React from 'react';
import { Grid, Paper, Box, Typography, Button, Alert } from '@mui/material';
import EmergencyCard from './medicard/EmergencyCard';
import './medicard/MedicardPanel.css';

export default function MedicardPanel({ dashboardData, handleDownloadEmergencyCard, cardDownloading, cardError, emergencyCardRef, emergencyQrPayload }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
            <Box>
              <Typography variant="h6" gutterBottom>Emergency Medicard</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 420 }}>
                Download and print this card to keep in your wallet. The QR code contains essential information that first responders can use during emergencies.
              </Typography>
              <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleDownloadEmergencyCard} disabled={cardDownloading}>
                {cardDownloading ? 'Preparing Card...' : 'Download Emergency Card'}
              </Button>
              {cardError && (
                <Alert severity="error" sx={{ mt: 2, width: 'fit-content' }}>{cardError}</Alert>
              )}
            </Box>
            <Box className="patient-emergency-card-wrapper">
              <EmergencyCard dashboardData={dashboardData} emergencyCardRef={emergencyCardRef} emergencyQrPayload={emergencyQrPayload} />
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
