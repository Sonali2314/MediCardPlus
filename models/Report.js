const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  reportType: {
    type: String,
    required: [true, 'Please add report type']
  },
  reportFile: {
    type: String,
    required: [true, 'Please upload report file']
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  labName: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', ReportSchema);