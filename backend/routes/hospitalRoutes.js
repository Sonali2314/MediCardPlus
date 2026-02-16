import express from 'express';
import auth, { checkRole } from '../middleware/auth.js';
import Hospital from '../models/hospitalModel.js';
import Doctor from '../models/doctorModel.js';
import { sendDoctorCredentials } from '../services/emailService.js';

const router = express.Router();

// Get hospital dashboard data
// Get all doctors for the hospital
router.get('/doctors', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user.id)
            .populate('doctors', '-password');

        if (!hospital) {
            return res.status(404).json({
                ok: false,
                message: 'Hospital not found'
            });
        }

        res.json({
            ok: true,
            doctors: hospital.doctors
        });
    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching doctors'
        });
    }
});

// Add a new doctor
router.post('/doctors', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const { fullName, email, specialization, phoneNumber, department } = req.body;

        // Validate required fields
        if (!fullName || !email || !specialization || !phoneNumber) {
            return res.status(400).json({
                ok: false,
                message: 'Missing required fields: fullName, email, specialization, phoneNumber'
            });
        }

        // Check if doctor with this email already exists
        const existingDoctor = await Doctor.findOne({ email: email.toLowerCase() });
        if (existingDoctor) {
            return res.status(400).json({
                ok: false,
                message: 'A doctor with this email already exists'
            });
        }

        // Get hospital info for email
        const hospital = await Hospital.findById(req.user.id);
        if (!hospital) {
            return res.status(404).json({
                ok: false,
                message: 'Hospital not found'
            });
        }

        // Generate a secure random password (8-12 characters, alphanumeric)
        const generatePassword = () => {
            const length = 10;
            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let password = '';
            for (let i = 0; i < length; i++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return password;
        };

        const generatedPassword = generatePassword();

        // Generate a unique license number based on hospital and timestamp
        const licenseNumber = `DOC-${req.user.id.toString().substr(-4)}-${Date.now().toString().substr(-6)}`;

        // Create the doctor with auto-generated password
        const doctor = await Doctor.create({
            fullName,
            email: email.toLowerCase(),
            password: generatedPassword,
            specialization,
            phoneNumber,
            licenseNumber,
            hospital: req.user.id,
            department: department || null,
            isActive: true,
            addedByHospital: true
        });

        // Add doctor to hospital's doctors array
        await Hospital.findByIdAndUpdate(req.user.id, {
            $push: { doctors: doctor._id }
        });

        // Send credentials email
        const emailResult = await sendDoctorCredentials(
            doctor.email,
            doctor.fullName,
            generatedPassword,
            hospital.fullName,
            department || 'Not assigned'
        );

        res.status(201).json({
            ok: true,
            message: 'Doctor added successfully. Login credentials have been sent to their email.',
            emailSent: emailResult.success,
            doctor: {
                _id: doctor._id,
                fullName: doctor.fullName,
                email: doctor.email,
                specialization: doctor.specialization,
                phoneNumber: doctor.phoneNumber,
                licenseNumber: doctor.licenseNumber,
                department: doctor.department
            }
        });
    } catch (error) {
        console.error('Add doctor error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                message: 'A doctor with this email or license number already exists'
            });
        }

        res.status(500).json({
            ok: false,
            message: 'Error adding doctor',
            details: error.message
        });
    }
});

// Update a doctor
router.put('/doctors/:doctorId', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { fullName, email, specialization, phoneNumber, department } = req.body;

        // Verify doctor belongs to this hospital
        const doctor = await Doctor.findOne({
            _id: doctorId,
            hospital: req.user.id
        });

        if (!doctor) {
            return res.status(404).json({
                ok: false,
                message: 'Doctor not found or not associated with this hospital'
            });
        }

        // Update doctor
        const updateData = {
            fullName,
            email,
            specialization,
            phoneNumber
        };
        
        if (department !== undefined) {
            updateData.department = department;
        }

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            updateData,
            { new: true }
        ).select('-password');

        res.json({
            ok: true,
            message: 'Doctor updated successfully',
            doctor: updatedDoctor
        });
    } catch (error) {
        console.error('Update doctor error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error updating doctor'
        });
    }
});

// Remove a doctor
router.delete('/doctors/:doctorId', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Remove doctor from hospital's doctors array
        await Hospital.findByIdAndUpdate(req.user.id, {
            $pull: { doctors: doctorId }
        });

        // Set doctor's hospital to null and isActive to false
        await Doctor.findByIdAndUpdate(doctorId, {
            hospital: null,
            isActive: false
        });

        res.json({
            ok: true,
            message: 'Doctor removed successfully'
        });
    } catch (error) {
        console.error('Remove doctor error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error removing doctor'
        });
    }
});

router.get('/dashboard', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user.id)
            .populate('doctors', 'patients')
            .select('-password');

        if (!hospital) {
            return res.status(404).json({
                ok: false,
                message: 'Hospital not found'
            });
        }

        // Calculate total patients by aggregating from all doctors
        let totalPatients = 0;
        if (hospital.doctors && hospital.doctors.length > 0) {
            for (const doctor of hospital.doctors) {
                if (doctor.patients) {
                    totalPatients += doctor.patients.length;
                }
            }
        }

        // Get hospital-specific dashboard data
        const dashboardData = {
            hospitalInfo: {
                fullName: hospital.fullName,
                email: hospital.email,
                registrationNumber: hospital.registrationNumber,
                type: hospital.type,
                phoneNumber: hospital.phoneNumber,
                address: hospital.address,
                facilities: hospital.facilities,
                departments: hospital.departments
            },
            stats: {
                totalDoctors: hospital.doctors ? hospital.doctors.length : 0,
                totalPatients: totalPatients,
                appointmentsToday: 0 // To be implemented when appointments are added
            }
        };

        res.json({
            ok: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Hospital dashboard error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching hospital dashboard data'
        });
    }
});

// Get hospital departments
router.get('/departments', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user.id)
            .select('departments doctors');

        if (!hospital) {
            return res.status(404).json({
                ok: false,
                message: 'Hospital not found'
            });
        }

        // Calculate patient count per department (simplified - assuming departments are strings)
        const departmentsWithStats = hospital.departments.map(dept => {
            // For now, distribute patients evenly across departments
            // In a real implementation, you'd have department-patient relationships
            const totalPatients = hospital.doctors ? hospital.doctors.reduce((sum, doctor) => sum + (doctor.patients ? doctor.patients.length : 0), 0) : 0;
            const patientCount = Math.floor(totalPatients / hospital.departments.length);

            return {
                id: dept.toLowerCase().replace(/\s+/g, '-'),
                name: dept,
                doctorCount: hospital.doctors ? hospital.doctors.length : 0,
                patientCount: patientCount
            };
        });

        res.json({
            ok: true,
            departments: departmentsWithStats
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching departments'
        });
    }
});

export default router;