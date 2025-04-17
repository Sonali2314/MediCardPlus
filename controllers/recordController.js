const MedicalRecord = require('../models/MedicalRecord');
const Visit = require('../models/Visit');
const Prescription = require('../models/Prescription');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// @desc    Get single medical record
// @route   GET /api/records/:id
// @access  Private (Patient & Doctor)
exports.getMedicalRecord = async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id)
      .populate({
        path: 'visits',
        populate: [
          { path: 'doctor', select: 'name specialization hospitalName' },
          { path: 'prescription' },
          { path: 'reports' }
        ]
      })
      .populate('patient', 'patientId fullName age gender');

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found'
      });
    }

    // Check if user has permission to view this record
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient || patient._id.toString() !== medicalRecord.patient._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this record'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: medicalRecord
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single visit
// @route   GET /api/records/visits/:id
// @access  Private (Patient & Doctor)
exports.getVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('doctor', 'name specialization hospitalName')
      .populate('prescription')
      .populate('reports')
      .populate({
        path: 'medicalRecord',
        populate: { path: 'patient', select: 'patientId fullName' }
      });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    // Check if user has permission to view this visit
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient || patient._id.toString() !== visit.medicalRecord.patient._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this visit'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: visit
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get prescription
// @route   GET /api/records/prescriptions/:id
// @access  Private (Patient & Doctor)
exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctor', 'name specialization hospitalName')
      .populate('patient', 'patientId fullName');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    // Check if user has permission to view this prescription
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient || patient._id.toString() !== prescription.patient._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this prescription'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get report
// @route   GET /api/records/reports/:id
// @access  Private (Patient & Doctor)
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('patient', 'patientId fullName');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check if user has permission to view this report
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      
      if (!patient || patient._id.toString() !== report.patient._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this report'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};