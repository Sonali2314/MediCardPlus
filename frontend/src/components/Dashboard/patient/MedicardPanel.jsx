import React from 'react';
import { Grid, Paper, Box, Typography, Button, Alert } from '@mui/material';
// icon dependency removed to avoid @mui/icons-material compatibility issues
import EmergencyCard from './medicard/EmergencyCard';
import './medicard/MedicardPanel.css';

export default function MedicardPanel({
  dashboardData,
  handleDownloadEmergencyCard,
  cardDownloading,
  cardError,
  emergencyCardRef,
  emergencyQrPayload
}) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper className="pd-card" elevation={0}>
          <div className="pd-card-header">
            <div>
              <Typography className="pd-card-title">Emergency Medicard</Typography>
              <Typography className="pd-card-sub">
                Download and print this card to keep in your wallet. The QR code contains
                essential information that first responders can use during emergencies.
              </Typography>
            </div>
          </div>

          {cardError && (
            <Alert severity="error" className="pd-alert">{cardError}</Alert>
          )}

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'flex-start' }}
            flexDirection={{ xs: 'column', md: 'row' }}
            gap={3}
          >
            {/* Left: description + download button */}
            <Box flex={1}>
              <Box
                sx={{
                  background: 'linear-gradient(to right, #EFF6FF, #EEF2FF)',
                  border: '1px solid #BFDBFE',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}
              >
                <Typography sx={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
                  <strong>How it works:</strong><br />
                  This card stores your critical medical information in a QR code.
                  In an emergency, first responders can scan it to instantly access
                  your blood group, contact info, and medical notes — even if you
                  are unable to communicate.
                </Typography>
              </Box>

              <Button
                className="pd-btn-primary"
                variant="contained"
                onClick={handleDownloadEmergencyCard}
                disabled={cardDownloading}
              >
                ⬇️
                {cardDownloading ? 'Preparing Card...' : 'Download Emergency Card'}
              </Button>
            </Box>

            {/* Right: card preview */}
            <Box className="patient-emergency-card-wrapper">
              <EmergencyCard
                dashboardData={dashboardData}
                emergencyCardRef={emergencyCardRef}
                emergencyQrPayload={emergencyQrPayload}
              />
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}