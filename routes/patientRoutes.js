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

// Protect all routes
router.use(protect);
router.use(authorize('patient'));

router.get('/profile', getPatientProfile);
router.put('/profile', updatePatientProfile);
router.get('/digital-card', getDigitalCard);
router.get('/medical-history', getMedicalHistory);
router.get('/allergies', getAllergies);

module.exports = router;