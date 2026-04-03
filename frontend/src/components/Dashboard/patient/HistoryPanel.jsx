import React from 'react';
import {
  Grid, Paper, Typography, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Box
} from '@mui/material';
// replaced icon usage with emojis to avoid @mui/icons-material package issues

export default function HistoryPanel({ prescriptions, medicalRecords, reports, handleFileDownload }) {
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
                  <TableCell>First Detected</TableCell>
                  <TableCell>Last Detected</TableCell>
                  <TableCell>Source</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prescriptions && prescriptions.length > 0 ? prescriptions.map((medication, idx) => (
                  <TableRow key={medication._id || idx}>
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
                        {medication.term || medication.medicine || 'Unknown'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {medication.firstSeen 
                        ? new Date(medication.firstSeen).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {medication.lastSeen 
                        ? new Date(medication.lastSeen).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {medication.sources && medication.sources.length > 0
                        ? medication.sources.map((src, i) => (
                            <div key={i} style={{ fontSize: '12px' }}>
                              {src}
                            </div>
                          ))
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow className="pd-empty-row">
                    <TableCell colSpan={4}>No medications on record</TableCell>
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
              <Typography className="pd-card-sub">Uploaded medical files and reports</Typography>
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
                {reports && reports.length > 0 ? reports.map((report, idx) => (
                  <TableRow key={report._id || idx}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        📄
                        {report.originalName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {report.uploadDate 
                        ? new Date(report.uploadDate).toLocaleString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {report.fileSize 
                        ? `${(report.fileSize / 1024).toFixed(1)} KB`
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell align="right">
                      <button
                        className="pd-btn-icon"
                        onClick={() => handleFileDownload && handleFileDownload(report._id, report.originalName)}
                        type="button"
                        title="Download"
                      >
                        ⬇️
                      </button>
                    </TableCell>
                  </TableRow>
                )) : (
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