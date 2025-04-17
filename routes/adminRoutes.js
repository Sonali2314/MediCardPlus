const express = require('express');
const router = express.Router();
const {
  getPendingDoctors,
  updateDoctorStatus,
  getUsers,
  getSystemStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/status', updateDoctorStatus);
router.get('/users', getUsers);
router.get('/stats', getSystemStats);

module.exports = router;