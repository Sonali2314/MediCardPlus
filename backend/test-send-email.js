import dotenv from 'dotenv';
dotenv.config();

import emailService from './services/emailService.js';

(async () => {
  try {
    console.log('Running test-send-email...');
    const res = await emailService.sendDoctorCredentials(
      'recipient@example.com',
      'Dr Test',
      'TempPass123!',
      'Test Hospital',
      'Cardiology'
    );
    console.log('Result:', res);
    process.exit(0);
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
})();
