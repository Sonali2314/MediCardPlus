import express from 'express';
import auth, { checkRole } from '../middleware/auth.js';
import Patient from '../models/patientModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/reports');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed!'));
        }
    }
});

const router = express.Router();

// Get patient dashboard data
router.get('/dashboard', auth, checkRole(['patient']), async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.id)
            .select('-password');

        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        // Get patient-specific dashboard data
        const dashboardData = {
            personalInfo: {
                fullName: patient.fullName,
                email: patient.email,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                bloodGroup: patient.bloodGroup,
                phoneNumber: patient.phoneNumber
            },
            // Add more patient-specific data here
            stats: {
                upcomingAppointments: 0, // To be implemented
                totalVisits: 0, // To be implemented
                prescriptions: 0 // To be implemented
            }
        };

        res.json({
            ok: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Patient dashboard error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching patient dashboard data'
        });
    }
});

// Upload medical report
router.post('/upload-report', auth, checkRole(['patient']), upload.single('report'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                message: 'No file uploaded'
            });
        }

        const patient = await Patient.findById(req.user.id);
        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        const reportData = {
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size
        };

        patient.reports.push(reportData);
        await patient.save();

        res.json({
            ok: true,
            message: 'Report uploaded successfully',
            report: reportData
        });
    } catch (error) {
        console.error('Report upload error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error uploading report'
        });
    }
});

// Download medical report
router.get('/download-report/:reportId', auth, checkRole(['patient']), async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.id);
        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        const report = patient.reports.id(req.params.reportId);
        if (!report) {
            return res.status(404).json({
                ok: false,
                message: 'Report not found'
            });
        }

        if (!fs.existsSync(report.filePath)) {
            return res.status(404).json({
                ok: false,
                message: 'File not found on server'
            });
        }

        res.download(report.filePath, report.originalName);
    } catch (error) {
        console.error('Report download error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error downloading report'
        });
    }
});

// Get patient's reports
router.get('/reports', auth, checkRole(['patient']), async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.id).select('reports');
        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        res.json({
            ok: true,
            reports: patient.reports
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching reports'
        });
    }
});

export default router;
