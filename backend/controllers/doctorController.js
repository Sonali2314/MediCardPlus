const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const Visit = require('../models/Visit');
const Prescription = require('../models/Prescription');
const Report = require('../models/Report');
const Allergy = require('../models/Allergy');

// @desc    Get doctor profile
// @route   GET /api/doctors/profile
// @access  Private (Doctor)
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
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

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (Doctor)
exports.updateDoctorProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      specialization: req.body.specialization,
      hospitalName: req.body.hospitalName,
      contactNumber: req.body.contactNumber
    };

    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture;
      await file.mv(`${process.env.FILE_UPLOAD_PATH}/doctors/${file.name}`);
      fieldsToUpdate.profilePicture = `/uploads/doctors/${file.name}`;
    }

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
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

// @desc    Get patient by ID or QR code
// @route   GET /api/doctors/patients/:patientId
// @access  Private (Doctor)
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Get medical records, allergies for complete patient profile
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

    const allergies = await Allergy.find({ patient: patient._id })
      .populate('diagnosedBy', 'name specialization');

    res.status(200).json({
      success: true,
      data: {
        patient,
        medicalRecords,
        allergies
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

// @desc    Search patients
// @route   GET /api/doctors/patients/search
// @access  Private (Doctor)
exports.searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a search query'
      });
    }

    const patients = await Patient.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { patientId: { $regex: query, $options: 'i' } },
        { contactNumber: { $regex: query, $options: 'i' } }
      ]
    }).select('patientId fullName age gender bloodGroup contactNumber');

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Add new medical visit
// @route   POST /api/doctors/visits
// @access  Private (Doctor)
exports.addVisit = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    const {
      patientId,
      diseaseName,
      visitDate,
      symptoms,
      diagnosis,
      notes,
      followUpDate,
      prescription,
      reports
    } = req.body;

    // Find patient
    const patient = await Patient.findOne({ patientId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Find or create medical record for this disease
    let medicalRecord = await MedicalRecord.findOne({
      patient: patient._id,
      diseaseName
    });

    if (!medicalRecord) {
      medicalRecord = await MedicalRecord.create({
        patient: patient._id,
        diseaseName,
        description: req.body.diseaseDescription || ''
      });
    }

    // Create new visit
    const newVisit = await Visit.create({
      medicalRecord: medicalRecord._id,
      doctor: doctor._id,
      visitDate: visitDate || Date.now(),
      symptoms,
      diagnosis,
      notes,
      followUpDate
    });

    // Process prescription if provided
    if (prescription && prescription.medications && prescription.medications.length > 0) {
      const newPrescription = await Prescription.create({
        visit: newVisit._id,
        doctor: doctor._id,
        patient: patient._id,
        medications: prescription.medications,
        additionalInstructions: prescription.additionalInstructions
      });

      newVisit.prescription = newPrescription._id;
      await newVisit.save();
    }

    // Process reports if files are uploaded
    if (req.files && req.files.reportFiles) {
      // Convert to array if single file
      const reportFiles = Array.isArray(req.files.reportFiles) 
        ? req.files.reportFiles 
        : [req.files.reportFiles];
      
      const reportTypes = Array.isArray(req.body.reportTypes) 
        ? req.body.reportTypes 
        : [req.body.reportTypes];
      
      const savedReports = [];

      for (let i = 0; i < reportFiles.length; i++) {
        const file = reportFiles[i];
        const fileName = `${Date.now()}-${file.name}`;
        await file.mv(`${process.env.FILE_UPLOAD_PATH}/reports/${fileName}`);

        const newReport = await Report.create({
          visit: newVisit._id,
          patient: patient._id,
          reportType: reportTypes[i] || 'General',
          reportFile: `/uploads/reports/${fileName}`,
          labName: req.body.labName || 'Not Specified',
          notes: req.body.reportNotes || ''
        });

        savedReports.push(newReport._id);
      }

      newVisit.reports = savedReports;
      await newVisit.save();
    }

    // Update medical record with new visit
    medicalRecord.visits.push(newVisit._id);
    medicalRecord.updatedAt = Date.now();
    await medicalRecord.save();

    res.status(201).json({
      success: true,
      data: {
        visit: newVisit,
        medicalRecord
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

// @desc    Add allergy to patient
// @route   POST /api/doctors/allergies
// @access  Private (Doctor)
exports.addAllergy = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found'
      });
    }

    const { patientId, name, severity, notes } = req.body;

    // Find patient
    const patient = await Patient.findOne({ patientId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Check if allergy already exists
    const existingAllergy = await Allergy.findOne({
      patient: patient._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingAllergy) {
      return res.status(400).json({
        success: false,
        error: 'This allergy is already recorded for this patient'
      });
    }

    // Create new allergy
    const allergy = await Allergy.create({
      patient: patient._id,
      name,
      severity,
      diagnosedBy: doctor._id,
      notes
    });

    res.status(201).json({
      success: true,
      data: allergy
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};