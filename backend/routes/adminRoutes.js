// 
const express = require('express');
const router = express.Router();
const {
  getPendingDoctors,
  updateDoctorStatus,
  getUsers,
  getSystemStats,
  getAllDoctors
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

// Add the missing route for all doctors
router.get('/doctors', getAllDoctors);
router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/status', updateDoctorStatus);
router.get('/users', getUsers);
router.get('/stats', getSystemStats);
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes working' });
});

module.exports = router;