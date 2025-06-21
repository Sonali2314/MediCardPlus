const express = require('express');
const router = express.Router();
const {
  getPatientProfile,
  updatePatientProfile,
  getDigitalCard,
  getMedicalHistory,
  getAllergies
} = require('../controllers/patientController');
const { protect, authorize } = require('../middlewares/auth');
const Patient = require('../models/Patient');
const path = require('path');
const { generateHealthCard } = require('../utils/generateCard');
const fs = require('fs');

// Protect all routes
router.use(protect);
router.use(authorize('patient'));

router.get('/profile', getPatientProfile);
router.put('/profile', updatePatientProfile);
router.get('/digital-card', getDigitalCard);
router.get('/medical-history', getMedicalHistory);
router.get('/allergies', getAllergies);

// Health card download route
router.get('/:patientId/health-card', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Generate or get existing health card
    let cardPath = patient.digitalCard;
    if (!cardPath) {
      cardPath = await generateHealthCard(patient);
      patient.digitalCard = cardPath;
      await patient.save();
    }

    // Absolute path to the PDF
    const absolutePath = path.resolve(__dirname, '..', cardPath.replace(/^\//, ''));

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        error: 'Health card file not found'
      });
    }

    // Set headers and send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=health-card-${patient.patientId}.pdf`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error serving health card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate health card'
    });
  }
});

module.exports = router;