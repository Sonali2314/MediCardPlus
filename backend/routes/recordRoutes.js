const express = require('express');
const router = express.Router();
const {
  getMedicalRecord,
  getVisit,
  getPrescription,
  getReport
} = require('../controllers/recordController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all routes
router.use(protect);
router.use(authorize('patient', 'doctor'));

router.get('/:id', getMedicalRecord);
router.get('/visits/:id', getVisit);
router.get('/prescriptions/:id', getPrescription);
router.get('/reports/:id', getReport);
router.get('/test', (req, res) => {
  res.json({ message: 'Record routes working' });
});
module.exports = router;