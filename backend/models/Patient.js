const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PatientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: String,
    default: () => `P-${uuidv4().substring(0, 8).toUpperCase()}`,
    unique: true
  },
  fullName: {
    type: String,
    required: [true, 'Please add a full name']
  },
  age: {
    type: Number,
    required: [true, 'Please add age']
  },
  gender: {
    type: String,
    required: [true, 'Please add gender'],
    enum: ['Male', 'Female', 'Other']
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add a contact number']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  governmentId: {
    type: String
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  profilePicture: {
    type: String,
    default: 'default-profile.jpg'
  },
  digitalCard: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Patient', PatientSchema);