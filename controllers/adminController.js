const User = require('../models/User');
const Doctor = require('../models/Doctor');

// @desc    Get all pending doctor approvals
// @route   GET /api/admin/doctors/pending
// @access  Private (Admin)
exports.getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ approvalStatus: 'pending' })
      .populate('user', 'email');

    res.status(200).json({
      success: true,
      count: pendingDoctors.length,
      data: pendingDoctors
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Approve or reject doctor
// @route   PUT /api/admin/doctors/:id/status
// @access  Private (Admin)
exports.updateDoctorStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status (approved or rejected)'
      });
    }

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    doctor.approvalStatus = status;
    await doctor.save();

    // If approved, update user's verification status
    if (status === 'approved') {
      await User.findByIdAndUpdate(doctor.user, { isVerified: true });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const pendingDoctorCount = await Doctor.countDocuments({ approvalStatus: 'pending' });
    const approvedDoctorCount = await Doctor.countDocuments({ approvalStatus: 'approved' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        patientCount,
        doctorCount,
        pendingDoctorCount,
        approvedDoctorCount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};