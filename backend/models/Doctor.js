const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: String,
    default: () => `D-${Math.floor(100000 + Math.random() * 900000)}`,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  specialization: {
    type: String,
    required: [true, 'Please add specialization']
  },
  hospitalName: {
    type: String,
    required: [true, 'Please add hospital name']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Please add registration number'],
    unique: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add a contact number']
  },
  medicalLicense: {
    type: String,
    required: [true, 'Please upload medical license']
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  profilePicture: {
    type: String,
    default: 'default-doctor.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Doctor', DoctorSchema);