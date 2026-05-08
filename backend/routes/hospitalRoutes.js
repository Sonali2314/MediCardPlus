import express from 'express';
import auth, { checkRole } from '../middleware/auth.js';
import Hospital from '../models/hospitalModel.js';
import Doctor from '../models/doctorModel.js';
import Patient from '../models/patientModel.js';
import { sendDoctorCredentials } from '../services/emailService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { extractInfoFromFile } from '../services/nlpExtractionService.js';
import { updatePatientMainInfo } from '../services/patientDataService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const reportsDir = path.join(__dirname, '../uploads/hospital-reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, reportsDir);
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

// Get all patients viewed through hospital (via their doctors)
router.get('/patients', auth, checkRole(['hospital']), async (req, res) => {
    try {
        console.log('Fetching patients for hospital:', req.user.id);
        
        // Get only patients added by this hospital
        const patients = await Patient.find({ 
            hospital: req.user.id,
            addedByHospital: true
        }).select('-password');

        console.log(`Found ${patients.length} patients for this hospital`);
        patients.forEach(p => {
            console.log(`Patient: ${p.fullName}, Hospital: ${p.hospital}, AddedByHospital: ${p.addedByHospital}`);
        });

        res.json({
            ok: true,
            patients: patients,
            totalPatients: patients.length
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching patients'
        });
    }
});

// Search for existing patient by email or ID - MUST come before :patientId route
router.get('/patients/search/:identifier', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const { identifier } = req.params;

        // Search by email or patient ID
        const patient = await Patient.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { _id: identifier }
            ]
        }).select('-password');

        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        res.json({
            ok: true,
            patient: {
                _id: patient._id,
                fullName: patient.fullName,
                email: patient.email,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                phoneNumber: patient.phoneNumber,
                bloodGroup: patient.bloodGroup,
                address: patient.address,
                createdAt: patient.createdAt
            }
        });
    } catch (error) {
        console.error('Search patient error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error searching for patient'
        });
    }
});

// Add existing patient to hospital
router.post('/patients/add/:patientId', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const { patientId } = req.params;
        const currentHospitalId = req.user.id;

        console.log(`Adding patient ${patientId} to hospital ${currentHospitalId}`);

        // Find the patient
        const patient = await Patient.findById(patientId);
        if (!patient) {
            console.log('Patient not found:', patientId);
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        console.log('Patient before update:', {
            id: patient._id,
            name: patient.fullName,
            hospital: patient.hospital,
            addedByHospital: patient.addedByHospital
        });

        // Check if patient is already added by this hospital
        if (patient.hospital && patient.hospital.toString() === currentHospitalId) {
            return res.status(400).json({
                ok: false,
                message: 'This patient is already added to your hospital'
            });
        }

        // Update patient with hospital info
        patient.hospital = currentHospitalId;
        patient.addedByHospital = true;
        
        console.log('Saving patient with hospital:', currentHospitalId);
        const savedPatient = await patient.save();
        
        console.log('Patient after save:', {
            id: savedPatient._id,
            name: savedPatient.fullName,
            hospital: savedPatient.hospital,
            addedByHospital: savedPatient.addedByHospital
        });

        res.json({
            ok: true,
            message: 'Patient added to hospital successfully',
            patient: {
                _id: savedPatient._id,
                fullName: savedPatient.fullName,
                email: savedPatient.email,
                dateOfBirth: savedPatient.dateOfBirth,
                gender: savedPatient.gender,
                phoneNumber: savedPatient.phoneNumber,
                hospital: savedPatient.hospital
            }
        });
    } catch (error) {
        console.error('Add patient error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error adding patient'
        });
    }
});

// ===== SPECIFIC PATIENT ROUTES (must come before general :patientId routes) =====

// Upload report for a patient
router.post('/patients/:patientId/upload-report', auth, checkRole(['hospital']), upload.single('report'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                message: 'No file uploaded'
            });
        }

        const { patientId } = req.params;
        console.log('Upload report - Patient ID:', patientId);
        console.log('Upload report - Current Hospital ID:', req.user.id);
        console.log('Upload report - File:', req.file.originalname);

        const patient = await Patient.findById(patientId).select('reports hospital');

        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        console.log('Upload report - Patient Hospital Field:', patient.hospital?.toString());

        // Verify patient belongs to this hospital
        if (!patient.hospital || patient.hospital.toString() !== req.user.id) {
            console.log('Upload: Permission denied');
            console.log('Patient hospital:', patient.hospital?.toString());
            console.log('Current user ID:', req.user.id);
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to upload reports for this patient. Patient not assigned to your hospital.'
            });
        }

        // Initialize reports array if it doesn't exist
        if (!patient.reports) {
            patient.reports = [];
        }

        const reportData = {
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            uploadDate: new Date()
        };

        // Extract medical information from file using NLP
        let mainInfoUpdateResult = null;
        let extractionError = null;

        try {
            const fileExtension = path.extname(req.file.originalname).substring(1).toLowerCase();
            console.log(`Extracting medical info from ${fileExtension} file...`);
            const extractedData = await extractInfoFromFile(req.file.path, fileExtension);

            // Update patient's main_info with extracted data
            const uploadMetadata = {
                fileName: reportData.fileName,
                originalName: reportData.originalName,
                uploadDate: reportData.uploadDate.toISOString()
            };

            mainInfoUpdateResult = updatePatientMainInfo(
                patientId,
                extractedData,
                uploadMetadata,
                patient
            );

            console.log(`Successfully extracted and updated main_info for patient ${patientId}`);
        } catch (nlpError) {
            console.error('NLP extraction error:', nlpError);
            extractionError = nlpError.message;
            // Continue even if extraction fails - report upload should succeed
        }

        // Add report to patient's reports array
        patient.reports.push(reportData);
        await patient.save();

        console.log('Report saved successfully. Total reports:', patient.reports.length);

        res.json({
            ok: true,
            message: 'Report uploaded successfully',
            report: reportData,
            mainInfo: mainInfoUpdateResult,
            extractionStatus: extractionError ? `Extraction completed with warning: ${extractionError}` : 'Extraction successful'
        });
    } catch (error) {
        console.error('Upload report error:', error);
        res.status(500).json({
            ok: false,
            message: error.message || 'Error uploading report',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}, (err, req, res, next) => {
    // Multer error handler
    console.error('Multer error:', err);
    res.status(400).json({
        ok: false,
        message: err.message || 'File upload error'
    });
});

// Get all reports for a patient
router.get('/patients/:patientId/reports', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findById(patientId).select('reports hospital');

        console.log('GET reports - Patient ID:', patientId);
        console.log('GET reports - Current Hospital ID:', req.user.id);
        console.log('GET reports - Patient Hospital Field:', patient?.hospital);

        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        // Verify patient belongs to this hospital
        if (!patient.hospital || patient.hospital.toString() !== req.user.id) {
            console.log('Permission check failed');
            console.log('Patient hospital:', patient.hospital?.toString());
            console.log('Current user ID:', req.user.id);
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to view reports for this patient'
            });
        }

        console.log('Permission check passed. Returning reports:', patient.reports?.length || 0);
        res.json({
            ok: true,
            reports: patient.reports || []
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching reports'
        });
    }
});

// Delete a report for a patient
router.delete('/patients/:patientId/reports/:reportIndex', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const { patientId, reportIndex } = req.params;
        const patient = await Patient.findById(patientId);

        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        // Verify patient belongs to this hospital
        if (!patient.hospital || patient.hospital.toString() !== req.user.id) {
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to delete reports for this patient'
            });
        }

        if (reportIndex < 0 || reportIndex >= patient.reports.length) {
            return res.status(400).json({
                ok: false,
                message: 'Invalid report index'
            });
        }

        // Delete file from system if it exists
        const reportFilePath = patient.reports[reportIndex].filePath;
        if (fs.existsSync(reportFilePath)) {
            fs.unlinkSync(reportFilePath);
        }

        // Remove report from array
        patient.reports.splice(reportIndex, 1);
        await patient.save();

        res.json({
            ok: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error deleting report'
        });
    }
});

// ===== GENERAL PATIENT ROUTES (must come after specific routes) =====

// Get specific patient details
router.get('/patients/:patientId', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.patientId).select('-password');

        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        res.json({
            ok: true,
            patient: patient
        });
    } catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error fetching patient'
        });
    }
});

// Delete/Remove patient from hospital
router.delete('/patients/:patientId', auth, checkRole(['hospital']), async (req, res) => {
    try {
        const { patientId } = req.params;

        // Find and update patient
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                ok: false,
                message: 'Patient not found'
            });
        }

        // Check if patient belongs to this hospital
        if (patient.hospital && patient.hospital.toString() !== req.user.id) {
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to remove this patient'
            });
        }

        // Remove hospital association
        patient.hospital = null;
        patient.addedByHospital = false;
        await patient.save();

        res.json({
            ok: true,
            message: 'Patient removed from hospital successfully'
        });
    } catch (error) {
        console.error('Remove patient error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error removing patient'
        });
    }
});

export default router;