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
router.get('/test', (req, res) => {
  res.json({ message: 'Doctor routes working' });
});
module.exports = router;
// const express = require('express');
// const router = express.Router();
// // Import doctor controller later
// // const { } = require('../controllers/doctorController');
// const { protect, authorize } = require('../middlewares/auth');

// Placeholder for doctor routes


module.exports = router;