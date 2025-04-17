const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: {
    type: String
  }
});

const PrescriptionSchema = new mongoose.Schema({
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  medications: [MedicationSchema],
  additionalInstructions: {
    type: String
  },
  prescriptionImage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);