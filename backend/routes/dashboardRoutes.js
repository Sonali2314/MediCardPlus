import express from 'express';
import mongoose from 'mongoose';
import authMiddleware, { checkRole } from '../middleware/auth.js';
import Patient from '../models/patientModel.js';
import Doctor from '../models/doctorModel.js';
import Hospital from '../models/hospitalModel.js';

const router = express.Router();

// Get hospital dashboard data
router.get('/hospital/:id', authMiddleware, checkRole(['hospital']), async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.user.id)
            .populate('doctors', 'fullName specialization isActive')
            .select('-password');

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        res.json(hospital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get doctor dashboard data
router.get('/doctor/:id', authMiddleware, checkRole(['doctor']), async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id)
            .populate('hospital', 'fullName type address')
            .select('-password');

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get patient dashboard data
router.get('/patient/:identifier', authMiddleware, checkRole(['patient', 'doctor']), async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Find patient by ID or fullName
        let patient;
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            // It's likely an ObjectId
            patient = await Patient.findById(identifier).select('-password');
        } else {
            // Search by fullName
            patient = await Patient.findOne({ fullName: identifier }).select('-password');
        }

        if (!patient) {
            return res.status(404).json({ ok: false, message: 'Patient not found' });
        }

        // Check permissions
        if (req.user.role === 'patient') {
            // Patients can only access their own data
            if (patient._id.toString() !== req.user.id) {
                return res.status(403).json({ ok: false, message: 'Access denied' });
            }
        } else if (req.user.role === 'doctor') {
            // Doctors can access patients associated with them
            const doctor = await Doctor.findById(req.user.id);
            if (!doctor || !doctor.patients.includes(patient._id)) {
                return res.status(403).json({ ok: false, message: 'Access denied: Patient not associated with this doctor' });
            }
        }

        // Include reports count in response
        const dashboardData = {
            ...patient.toObject(),
            reportsCount: patient.reports ? patient.reports.length : 0,
            reports: patient.reports || []
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Patient dashboard error:', error);
        res.status(500).json({ ok: false, message: 'Error fetching patient dashboard data' });
    }
});

// Get doctor's associated patients
router.get('/doctor/:id/patients', authMiddleware, checkRole(['doctor']), async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id).populate('patients', 'fullName dateOfBirth gender phoneNumber email');

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Transform data to match frontend expectations
        const transformedPatients = doctor.patients.map(patient => ({
            id: patient._id,
            name: patient.fullName,
            age: new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear(),
            condition: 'N/A', // Placeholder until medical history is implemented
            lastVisit: 'N/A' // Placeholder until appointments are implemented
        }));

        res.json(transformedPatients);
    } catch (error) {
        console.error('Error fetching doctor patients:', error);
        res.status(500).json({ message: 'Error fetching patients' });
    }
});

// Search patients for doctor (new route for searching)
router.get('/doctor/:id/search-patients', authMiddleware, checkRole(['doctor']), async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim().length === 0) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const trimmed = search.trim();
        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');

        // Search by fullName (case-insensitive partial/substring match); include ID match only when valid objectId
        const query = {
            $or: [
                { fullName: { $regex: regex } }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(trimmed)) {
            query.$or.push({ _id: trimmed });
        }

        const patients = await Patient.find(query)
            .select('fullName dateOfBirth gender phoneNumber email')
            .limit(20); // Limit results to prevent overwhelming response

        // Transform data to match frontend expectations
        const transformedPatients = patients.map(patient => ({
            id: patient._id,
            name: patient.fullName,
            age: new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear(),
            condition: 'N/A', // Placeholder until medical history is implemented
            lastVisit: 'N/A' // Placeholder until appointments are implemented
        }));

        res.json(transformedPatients);
    } catch (error) {
        console.error('Patient search error:', error);
        res.status(500).json({ message: 'Error searching patients' });
    }
});

// Add patient to doctor's list
router.post('/doctor/:id/patients/:patientId', authMiddleware, checkRole(['doctor']), async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Check if doctor exists
        const doctor = await Doctor.findById(req.user.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Check if patient is already in doctor's list
        if (doctor.patients.includes(patientId)) {
            return res.status(400).json({ message: 'Patient already added to your list' });
        }

        // Add patient to doctor's patients array
        doctor.patients.push(patientId);
        await doctor.save();

        res.json({ message: 'Patient added successfully' });
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ message: 'Error adding patient' });
    }
});

export default router;
