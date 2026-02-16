import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/db.js';
import Doctor from './models/doctorModel.js';
import Patient from './models/patientModel.js';
import Hospital from './models/hospitalModel.js';
import authMiddleware from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, message: 'Medicard backend' }));

// signup
app.post('/api/signup', async (req, res) => {
    try {
        const {
            userType,
            fullName,
            email,
            password,
            phoneNumber,
            licenseNumber,
            specialization,
            dateOfBirth,
            gender,
            address,
            registrationNumber,
            type
        } = req.body;

        if (!userType || !fullName || !password || !email) {
            return res.status(400).json({ ok: false, message: 'Missing required fields' });
        }

        const normalizedUserType = userType.toLowerCase();

        // Select the appropriate model based on user type
        let UserModel;
        let userData = {
            fullName,
            email: email.toLowerCase(),
            password,
            phoneNumber
        };

        switch (normalizedUserType) {
            case 'doctor':
                if (!licenseNumber || !specialization) {
                    return res.status(400).json({
                        ok: false,
                        message: 'Doctor registration requires licenseNumber and specialization'
                    });
                }
                userData.licenseNumber = licenseNumber;
                userData.specialization = specialization;
                UserModel = Doctor;
                break;

            case 'patient':
                if (!dateOfBirth || !gender) {
                    return res.status(400).json({
                        ok: false,
                        message: 'Patient registration requires dateOfBirth and gender'
                    });
                }
                userData.dateOfBirth = dateOfBirth;
                userData.gender = gender;
                UserModel = Patient;
                break;

            case 'hospital':
                if (!registrationNumber || !type || !address || !phoneNumber) {
                    return res.status(400).json({
                        ok: false,
                        message: 'Hospital registration requires registrationNumber, type, phoneNumber and address'
                    });
                }
                userData.registrationNumber = registrationNumber;
                userData.type = type;
                userData.address = address;
                UserModel = Hospital;
                break;

            default:
                return res.status(400).json({ ok: false, message: 'Invalid user type' });
        }

        // Check if user already exists
        const userExists = await UserModel.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ ok: false, message: 'Email already exists' });
        }

        // Create new user with the appropriate model
        const user = await UserModel.create(userData);

        const token = jwt.sign({ id: user._id.toString(), userType: normalizedUserType }, process.env.JWT_SECRET || 'fallback_secret', {
            expiresIn: '7d'
        });

        res.status(201).json({
            ok: true,
            user: {
                id: user._id,
                userType: normalizedUserType,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                ...(normalizedUserType === 'doctor' ? {
                    licenseNumber: user.licenseNumber,
                    specialization: user.specialization
                } : {}),
                ...(normalizedUserType === 'patient' ? {
                    dateOfBirth: user.dateOfBirth,
                    gender: user.gender
                } : {}),
                ...(normalizedUserType === 'hospital' ? {
                    registrationNumber: user.registrationNumber,
                    type: user.type,
                    address: user.address
                } : {})
            },
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        // Check for validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }
        // Check for duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                message: 'Duplicate field value entered',
                field: Object.keys(error.keyPattern)[0]
            });
        }
        res.status(500).json({
            ok: false,
            message: 'Error creating user account',
            details: error.message
        });
    }
});


// login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, userType } = req.body;
        if (!email || !password || !userType) {
            return res.status(400).json({ ok: false, message: 'Missing fields' });
        }

        const normalizedUserType = userType.toLowerCase();

        // Select the appropriate model based on user type
        let UserModel;
        switch (normalizedUserType) {
            case 'doctor':
                UserModel = Doctor;
                break;
            case 'patient':
                UserModel = Patient;
                break;
            case 'hospital':
                UserModel = Hospital;
                break;
            default:
                return res.status(400).json({ ok: false, message: 'Invalid user type' });
        }

        // Find user by email
        const user = await UserModel.findOne({
            email: email.toLowerCase()
        });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ ok: false, message: 'Invalid credentials' });
        }

        // For doctors: Check if they were added by a hospital and are active
        if (normalizedUserType === 'doctor') {
            if (!user.hospital || !user.isActive || !user.addedByHospital) {
                return res.status(403).json({ 
                    ok: false, 
                    message: 'Access denied. Only doctors added by hospitals can login. Please contact your hospital administrator.' 
                });
            }
        }

        const token = jwt.sign({
            id: user._id.toString(),
            userType: normalizedUserType
        }, process.env.JWT_SECRET || 'fallback_secret', {
            expiresIn: '7d'
        });

        // Determine dashboard redirect URL based on user type
        let dashboardUrl = '';
        switch (normalizedUserType) {
            case 'doctor':
                dashboardUrl = '/doctor';
                break;
            case 'patient':
                dashboardUrl = '/patient';
                break;
            case 'hospital':
                dashboardUrl = '/hospital';
                break;
        }

        res.json({
            ok: true,
            user: {
                id: user._id,
                userType: normalizedUserType,
                fullName: user.fullName,
                email: user.email
            },
            token,
            dashboardUrl
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ ok: false, message: 'Error during login' });
    }
});

// Import route handlers
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Use route handlers
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Get current user info
app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        const { userType } = req.user;
        let UserModel;

        switch (userType.toLowerCase()) {
            case 'doctor':
                UserModel = Doctor;
                break;
            case 'patient':
                UserModel = Patient;
                break;
            case 'hospital':
                UserModel = Hospital;
                break;
            default:
                return res.status(400).json({ ok: false, message: 'Invalid user type' });
        }

        const user = await UserModel.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ ok: false, message: 'User not found' });
        }
        res.json({ ok: true, user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ ok: false, message: 'Error fetching user data' });
    }
});

// Get dashboard data
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        const { userType } = req.user;
        let UserModel;

        switch (userType.toLowerCase()) {
            case 'doctor':
                UserModel = Doctor;
                break;
            case 'patient':
                UserModel = Patient;
                break;
            case 'hospital':
                UserModel = Hospital;
                break;
            default:
                return res.status(400).json({ ok: false, message: 'Invalid user type' });
        }

        const user = await UserModel.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ ok: false, message: 'User not found' });
        }

        let dashboardData = {
            userInfo: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                userType: user.userType,
                ...user.toObject()
            },
            stats: {
                lastLogin: new Date().toISOString()
            }
        };

        res.json({ ok: true, data: dashboardData });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ ok: false, message: 'Error fetching dashboard data' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Medicard backend running on http://localhost:${PORT}`);
});
