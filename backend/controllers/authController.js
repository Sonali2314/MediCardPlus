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
    console.log('Registration request received:', req.body);
    
    const { email, password, role } = req.body;

    // Check for required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password and role'
      });
    }

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
        bloodGroup
      } = req.body;

      // Validate required patient fields
      if (!fullName || !age || !gender || !contactNumber || !address) {
        // Delete the created user if validation fails
        await User.findByIdAndDelete(user._id);
        
        return res.status(400).json({
          success: false,
          error: 'Please provide all required patient information'
        });
      }

      // Create emergency contact object only if data is provided
      const emergencyContact = req.body.emergencyName ? {
        name: req.body.emergencyName,
        relation: req.body.emergencyRelation || '',
        phone: req.body.emergencyPhone || ''
      } : undefined;

      // Handle government ID file if provided
      let governmentId = '';
      if (req.files && req.files.governmentId) {
        const file = req.files.governmentId;
        const fileName = `gov_id_${Date.now()}_${file.name}`;
        await file.mv(`${process.env.FILE_UPLOAD_PATH || './public/uploads'}/patients/${fileName}`);
        governmentId = `/uploads/patients/${fileName}`;
      }

      const patient = await Patient.create({
        user: user._id,
        fullName,
        age,
        gender,
        contactNumber,
        address,
        governmentId,
        bloodGroup: bloodGroup || 'Unknown',
        emergencyContact
      });

      // Generate digital health card
      try {
        const cardPath = await generateHealthCard(patient);
        patient.digitalCard = cardPath;
        await patient.save();
      } catch (cardError) {
        console.error('Error generating health card:', cardError);
        // We'll continue even if card generation fails
      }
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

      // Validate required doctor fields
      if (!name || !specialization || !hospitalName || !registrationNumber || !contactNumber) {
        // Delete the created user if validation fails
        await User.findByIdAndDelete(user._id);
        
        return res.status(400).json({
          success: false,
          error: 'Please provide all required doctor information'
        });
      }

      // Handle file upload for medical license
      let medicalLicensePath = '';
      if (req.files && req.files.medicalLicense) {
        const file = req.files.medicalLicense;
        const fileName = `license_${Date.now()}_${file.name}`;
        await file.mv(`${process.env.FILE_UPLOAD_PATH || './public/uploads'}/doctors/${fileName}`);
        medicalLicensePath = `/uploads/doctors/${fileName}`;
      } else {
        // Medical license is required for doctors
        await User.findByIdAndDelete(user._id);
        
        return res.status(400).json({
          success: false,
          error: 'Please upload your medical license'
        });
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

    // If role is admin, handle admin registration
    if (role === 'admin') {
      const { name, adminId, secretKey, contactNumber } = req.body;
      
      // Validate required admin fields
      if (!name || !adminId || !secretKey || !contactNumber) {
        // Delete the created user if validation fails
        await User.findByIdAndDelete(user._id);
        
        return res.status(400).json({
          success: false,
          error: 'Please provide all required admin information'
        });
      }
      
      // Check if secret key matches the environment variable
      if (secretKey !== process.env.ADMIN_SECRET_KEY) {
        // Delete the created user if secret key doesn't match
        await User.findByIdAndDelete(user._id);
        
        return res.status(400).json({
          success: false,
          error: 'Invalid admin secret key'
        });
      }

      // Auto-verify admin if secret key matches
      user.isVerified = true;
      await user.save();
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + (err.message || 'Unknown error')
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate email, password, and role
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email, password, and role'
      });
    }

    // Find user by email and role
    const user = await User.findOne({ email, role }).select('+password');

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

    // Check if admin is verified (should already be verified during registration)
    if (user.role === 'admin' && !user.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Your admin account is not activated'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + (err.message || 'Unknown error')
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
    // Admin users don't have additional profiles

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
