const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  diseaseName: {
    type: String,
    required: [true, 'Please add disease name']
  },
  description: {
    type: String
  },
  visits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  }],
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Chronic', 'Under Treatment'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);