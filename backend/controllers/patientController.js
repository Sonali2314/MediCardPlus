const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const Allergy = require('../models/Allergy');
const Visit = require('../models/Visit');
const { generateHealthCard } = require('../utils/generateCard');

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private (Patient)
exports.getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/profile
// @access  Private (Patient)
exports.updatePatientProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      fullName: req.body.fullName,
      age: req.body.age,
      gender: req.body.gender,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      bloodGroup: req.body.bloodGroup,
      emergencyContact: req.body.emergencyContact
    };

    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture;
      await file.mv(`${process.env.FILE_UPLOAD_PATH}/patients/${file.name}`);
      fieldsToUpdate.profilePicture = `/uploads/patients/${file.name}`;
    }

    const patient = await Patient.findOneAndUpdate(
      { user: req.user.id },
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found'
      });
    }

    // Regenerate digital health card with updated info
    const cardPath = await generateHealthCard(patient);
    patient.digitalCard = cardPath;
    await patient.save();

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get patient's digital health card
// @route   GET /api/patients/digital-card
// @access  Private (Patient)
exports.getDigitalCard = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found'
      });
    }

    if (!patient.digitalCard) {
      // Generate digital card if not exists
      const cardPath = await generateHealthCard(patient);
      patient.digitalCard = cardPath;
      await patient.save();
    }

    res.status(200).json({
      success: true,
      data: {
        cardPath: patient.digitalCard
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

// @desc    Get patient's medical history
// @route   GET /api/patients/medical-history
// @access  Private (Patient)
exports.getMedicalHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found'
      });
    }

    const medicalRecords = await MedicalRecord.find({ patient: patient._id })
      .sort('-updatedAt')
      .populate({
        path: 'visits',
        populate: [
          { path: 'doctor', select: 'name specialization hospitalName' },
          { path: 'prescription' },
          { path: 'reports' }
        ]
      });

    res.status(200).json({
      success: true,
      count: medicalRecords.length,
      data: medicalRecords
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get patient's allergies
// @route   GET /api/patients/allergies
// @access  Private (Patient)
exports.getAllergies = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found'
      });
    }

    const allergies = await Allergy.find({ patient: patient._id })
      .populate('diagnosedBy', 'name specialization');

    res.status(200).json({
      success: true,
      count: allergies.length,
      data: allergies
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};