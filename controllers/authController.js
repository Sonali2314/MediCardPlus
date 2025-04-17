const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { generateToken } = require('../middlewares/auth');
const { generateHealthCard } = require('../utils/generateCard');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      role
    });

    // If role is patient, create patient profile
    if (role === 'patient') {
      const {
        fullName,
        age,
        gender,
        contactNumber,
        address,
        governmentId,
        bloodGroup,
        emergencyContact
      } = req.body;

      const patient = await Patient.create({
        user: user._id,
        fullName,
        age,
        gender,
        contactNumber,
        address,
        governmentId,
        bloodGroup,
        emergencyContact
      });

      // Generate digital health card
      const cardPath = await generateHealthCard(patient);
      patient.digitalCard = cardPath;
      await patient.save();
    }

    // If role is doctor, create doctor profile
    if (role === 'doctor') {
      const {
        name,
        specialization,
        hospitalName,
        registrationNumber,
        contactNumber
      } = req.body;

      // Handle file upload for medical license
      let medicalLicensePath = '';
      if (req.files && req.files.medicalLicense) {
        const file = req.files.medicalLicense;
        // Move file to upload directory
        await file.mv(`${process.env.FILE_UPLOAD_PATH}/doctors/${file.name}`);
        medicalLicensePath = `/uploads/doctors/${file.name}`;
      }

      await Doctor.create({
        user: user._id,
        name,
        specialization,
        hospitalName,
        registrationNumber,
        contactNumber,
        medicalLicense: medicalLicensePath
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if doctor is verified
    if (user.role === 'doctor' && !user.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Your account is pending approval from admin'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    let profile = null;
    
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile
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

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = generateToken(user);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      role: user.role,
      id: user._id
    });
};