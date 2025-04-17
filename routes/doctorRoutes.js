const express = require('express');
const router = express.Router();
const {
  getDoctorProfile,
  updateDoctorProfile,
  getPatientById,
  searchPatients,
  addVisit,
  addAllergy
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all routes
router.use(protect);
router.use(authorize('doctor'));

router.get('/profile', getDoctorProfile);
router.put('/profile', updateDoctorProfile);
router.get('/patients/:patientId', getPatientById);
router.get('/patients/search', searchPatients);
router.post('/visits', addVisit);
router.post('/allergies', addAllergy);

module.exports = router;