const mongoose = require('mongoose');

const AllergySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add allergy name']
  },
  severity: {
    type: String,
    enum: ['Mild', 'Moderate', 'Severe'],
    required: true
  },
  diagnosedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  diagnosedDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Allergy', AllergySchema);