import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const patientSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    phoneNumber: {
        type: String,
        required: true
    },
    address: new mongoose.Schema({
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String }
    }, { _id: false }),
    emergencyContact: new mongoose.Schema({
        name: { type: String },
        relationship: { type: String },
        phoneNumber: { type: String }
    }, { _id: false }),
    reports: [{
        fileName: { type: String, required: true },
        originalName: { type: String, required: true },
        filePath: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
        fileSize: { type: Number, required: true }
    }],
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    },
    addedByHospital: {
        type: Boolean,
        default: false
    },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
}, {
    timestamps: true
});

// Hash password before saving
patientSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match password method
patientSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;