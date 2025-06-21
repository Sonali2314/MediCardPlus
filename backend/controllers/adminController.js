// const User = require('../models/User');
// const Doctor = require('../models/Doctor');
// const Patient = require('../models/Patient');

// // @desc    Get all doctors (including unverified)
// // @route   GET /api/admin/doctors
// // @access  Private/Admin
// exports.getDoctors = async (req, res) => {
//   try {
//     // Find all users with role='doctor'
//     const doctorUsers = await User.find({ role: 'doctor' });
    
//     // Get the doctor profiles with user information
//     const doctors = await Promise.all(
//       doctorUsers.map(async (user) => {
//         const doctorProfile = await Doctor.findOne({ user: user._id });
//         return {
//           userId: user._id,
//           email: user.email,
//           isVerified: user.isVerified,
//           createdAt: user.createdAt,
//           ...doctorProfile ? doctorProfile.toObject() : { profile: 'Not completed' }
//         };
//       })
//     );
    
//     res.status(200).json({
//       success: true,
//       count: doctors.length,
//       data: doctors
//     });
//   } catch (err) {
//     console.error('Error fetching doctors:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // @desc    Get all patients
// // @route   GET /api/admin/patients
// // @access  Private/Admin
// exports.getPatients = async (req, res) => {
//   try {
//     // Find all users with role='patient'
//     const patientUsers = await User.find({ role: 'patient' });
    
//     // Get the patient profiles with user information
//     const patients = await Promise.all(
//       patientUsers.map(async (user) => {
//         const patientProfile = await Patient.findOne({ user: user._id });
//         return {
//           userId: user._id,
//           email: user.email,
//           createdAt: user.createdAt,
//           ...patientProfile ? patientProfile.toObject() : { profile: 'Not completed' }
//         };
//       })
//     );
    
//     res.status(200).json({
//       success: true,
//       count: patients.length,
//       data: patients
//     });
//   } catch (err) {
//     console.error('Error fetching patients:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // @desc    Verify a doctor
// // @route   PUT /api/admin/doctors/:id/verify
// // @access  Private/Admin
// exports.verifyDoctor = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
    
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }
    
//     if (user.role !== 'doctor') {
//       return res.status(400).json({
//         success: false,
//         error: 'User is not a doctor'
//       });
//     }
    
//     user.isVerified = true;
//     await user.save();
    
//     res.status(200).json({
//       success: true,
//       data: user
//     });
//   } catch (err) {
//     console.error('Error verifying doctor:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // @desc    Reject a doctor
// // @route   PUT /api/admin/doctors/:id/reject
// // @access  Private/Admin
// exports.rejectDoctor = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
    
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }
    
//     if (user.role !== 'doctor') {
//       return res.status(400).json({
//         success: false,
//         error: 'User is not a doctor'
//       });
//     }
    
//     // Find and delete the doctor profile
//     await Doctor.findOneAndDelete({ user: user._id });
    
//     // Delete the user account
//     await User.findByIdAndDelete(user._id);
    
//     res.status(200).json({
//       success: true,
//       message: 'Doctor application rejected and account removed'
//     });
//   } catch (err) {
//     console.error('Error rejecting doctor:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };
// // @desc    Get all doctors (including unverified)
// // @route   GET /api/admin/doctors
// // @access  Private/Admin
// exports.getAllDoctors = async (req, res) => {
//   try {
//     // Find all doctor users
//     const doctorUsers = await User.find({ role: 'doctor' }).select('-password');

//     // Find corresponding doctor profiles and combine data
//     const doctors = await Promise.all(
//       doctorUsers.map(async (user) => {
//         const doctorProfile = await Doctor.findOne({ user: user._id });

//         return {
//           _id: user._id,
//           email: user.email,
//           isVerified: user.isVerified,
//           createdAt: user.createdAt,
//           ...(doctorProfile ? doctorProfile.toObject() : {})
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       count: doctors.length,
//       data: doctors
//     });
//   } catch (err) {
//     console.error('Error fetching all doctors:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// exports.getSystemStats = async (req, res) => {
//   try {
//     const totalPatients = await User.countDocuments({ role: 'patient' });
//     const totalDoctors = await User.countDocuments({ role: 'doctor' });
//     const verifiedDoctors = await User.countDocuments({ role: 'doctor', isVerified: true });
//     const pendingDoctors = await User.countDocuments({ role: 'doctor', isVerified: false });
    
//     res.status(200).json({
//       success: true,
//       data: {
//         totalPatients,
//         totalDoctors,
//         verifiedDoctors,
//         pendingDoctors
//       }
//     });
//   } catch (err) {
//     console.error('Error getting stats:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

exports.getAllDoctors = async (req, res) => {
  try {
    const doctorUsers = await User.find({ role: 'doctor' }).select('-password');
    const doctors = await Promise.all(
      doctorUsers.map(async (user) => {
        const doctorProfile = await Doctor.findOne({ user: user._id });
        return {
          _id: user._id,
          email: user.email,
          name: doctorProfile?.name || 'Unknown',
          specialization: doctorProfile?.specialization || 'Not specified',
          hospitalName: doctorProfile?.hospitalName || 'Not specified',
          registrationNumber: doctorProfile?.registrationNumber || 'Not provided',
          contactNumber: doctorProfile?.contactNumber || 'Not provided',
          medicalLicense: doctorProfile?.medicalLicense || '#',
          approvalStatus: user.isVerified ? 'approved' : 'pending',
          createdAt: user.createdAt
        };
      })
    );
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    console.error('Error fetching all doctors:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getPendingDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isVerified: false });
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    console.error('Error fetching pending doctors:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateDoctorStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    user.isVerified = req.body.isVerified;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Error updating doctor status:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const verifiedDoctors = await User.countDocuments({ role: 'doctor', isVerified: true });
    const pendingDoctors = await User.countDocuments({ role: 'doctor', isVerified: false });

    res.status(200).json({
      success: true,
      data: { totalPatients, totalDoctors, verifiedDoctors, pendingDoctors }
    });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};