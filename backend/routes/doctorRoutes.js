import express from 'express';
import auth, { checkRole } from '../middleware/auth.js';
import Doctor from '../models/doctorModel.js';

const router = express.Router();

// Get doctor dashboard data
router.get('/dashboard', auth, checkRole(['doctor']), async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user._id)
            .select('-password');

        if (!doctor) {
            return res.status(404).json({
                ok: false,
                message: 'Doctor not found'
            });
        }

        // Get doctor-specific dashboard data
        const dashboardData = {
            personalInfo: {
                fullName: doctor.fullName,
                email: doctor.email,
                specialization: doctor.specialization,
                licenseNumber: doctor.licenseNumber,
                phoneNumber: doctor.phoneNumber
            },
            // Add more doctor-specific data here
            stats: {
                totalPatients: 0, // To be implemented
                appointmentsToday: 0, // To be implemented
                totalAppointments: 0 // To be implemented
            }
        };

        res.json({
            ok: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Doctor dashboard error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching doctor dashboard data'
        });
    }
});

export default router;