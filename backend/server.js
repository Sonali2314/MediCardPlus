// // const express = require('express');
// // const dotenv = require('dotenv');
// // const cors = require('cors');
// // const connectDB = require('./config/db');
// // const path = require('path');
// // const passport = require('passport');

// // // Load environment variables
// // dotenv.config();

// // // Connect to database
// // connectDB();

// // // Initialize Express app
// // const app = express();

// // // Body parser
// // app.use(express.json());

// // // Enable CORS
// // app.use(cors());

// // // Initialize Passport
// // app.use(passport.initialize());
// // require('./config/passport')(passport);

// // // Set static folder
// // app.use(express.static(path.join(__dirname, 'public')));

// // // Mount routes
// // app.use('/api/auth', require('./routes/authRoutes'));
// // app.use('/api/patients', require('./routes/patientRoutes'));
// // app.use('/api/doctors', require('./routes/doctorRoutes'));
// // app.use('/api/records', require('./routes/recordRoutes'));
// // app.use('/api/admin', require('./routes/adminRoutes'));

// // // Error handling middleware
// // app.use((err, req, res, next) => {
// //   console.error(err.stack);
// //   res.status(500).json({
// //     success: false,
// //     error: 'Server Error'
// //   });
// // });

// // // Define port
// // const PORT = process.env.PORT || 5000;

// // // Start server
// // const server = app.listen(PORT, () => {
// //   console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
// // });

// // // Handle unhandled promise rejections
// // process.on('unhandledRejection', (err, promise) => {
// //   console.log(`Error: ${err.message}`);
// //   // Close server & exit process
// //   server.close(() => process.exit(1));
// // });
// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const path = require('path');
// const passport = require('passport');
// const fileUpload = require('express-fileupload');

// // Load environment variables
// dotenv.config();

// // Connect to database
// connectDB();

// // Initialize Express app
// const app = express();

// // Body parser
// app.use(express.json());

// // Enable CORS
// app.use(cors());

// // File Upload
// app.use(fileUpload());

// // Initialize Passport
// app.use(passport.initialize());
// require('./config/passport')(passport);

// // Set static folder
// app.use(express.static(path.join(__dirname, 'public')));

// // Route definitions
// const authRoutes = require('./routes/authRoutes');
// const patientRoutes = require('./routes/patientRoutes');
// const doctorRoutes = require('./routes/doctorRoutes');
// const recordRoutes = require('./routes/recordRoutes');
// const adminRoutes = require('./routes/adminRoutes');

// // Mount routes
// app.use('/api/auth', authRoutes);
// app.use('/api/patients', patientRoutes);
// app.use('/api/doctors', doctorRoutes);
// app.use('/api/records', recordRoutes);
// app.use('/api/admin', adminRoutes);

// // Basic test route to verify server is working
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'API is working' });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     error: 'Server Error'
//   });
// });

// const PORT = process.env.PORT || 5000; // ✅ THIS IS CORRECT


// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err, promise) => {
//   console.log(`Error: ${err.message}`);
//   // Close server & exit process
//   server.close(() => process.exit(1));
// });
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'API is working' });
// // });
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const passport = require('passport');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', process.env.FRONTEND_URL || '*'],
  credentials: true
}));

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: process.env.MAX_FILE_UPLOAD || 5 * 1024 * 1024 }, // 5MB default
}));

// Initialize Passport
app.use(passport.initialize());
require('./config/passport')(passport);

// Ensure upload directories exist
const uploadDir = process.env.FILE_UPLOAD_PATH || './public/uploads';
const patientDir = path.join(uploadDir, 'patients');
const doctorDir = path.join(uploadDir, 'doctors');
const reportsDir = path.join(uploadDir, 'reports');

[uploadDir, patientDir, doctorDir, reportsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory created: ${dir}`);
  }
});

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error: ' + (err.message || 'Unknown error')
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Error: ${err.message}`);
  server.close(() => process.exit(1));
});
