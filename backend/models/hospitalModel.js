import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const hospitalSchema = new mongoose.Schema({
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
    registrationNumber: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['government', 'private', 'other'],
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    address: new mongoose.Schema({
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true }
    }, { _id: false }),
    facilities: [{
        type: String
    }],
    departments: [{
        type: String
    }],
    doctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
}, {
    timestamps: true
});

// Hash password before saving
hospitalSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match password method
hospitalSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;