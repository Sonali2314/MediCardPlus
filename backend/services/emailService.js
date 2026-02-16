import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    // For development, use Gmail or a test service
    // In production, use proper SMTP credentials from environment variables
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send doctor credentials email
export const sendDoctorCredentials = async (doctorEmail, doctorName, password, hospitalName, department) => {
    try {
        // If email credentials are not configured, log to console instead
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('\n=== DOCTOR CREDENTIALS EMAIL (Email service not configured) ===');
            console.log(`To: ${doctorEmail}`);
            console.log(`Subject: Welcome to ${hospitalName} - Your Medicard Login Credentials`);
            console.log(`\nDear ${doctorName},\n`);
            console.log(`You have been added as a doctor to ${hospitalName}.`);
            if (department) {
                console.log(`Department: ${department}`);
            }
            console.log(`\nYour login credentials are:`);
            console.log(`Email: ${doctorEmail}`);
            console.log(`Password: ${password}`);
            console.log(`\nPlease login at: http://localhost:3000/login`);
            console.log(`User Type: Doctor`);
            console.log(`\nPlease change your password after first login for security.`);
            console.log('==========================================\n');
            return { success: true, message: 'Credentials logged to console (email not configured)' };
        }

        const transporter = createTransporter();

        // Verify transporter connection/auth before attempting send
        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('Email transporter verification failed:', verifyError && verifyError.message ? verifyError.message : verifyError);
            // Let the outer catch handle fallback logging
            throw verifyError;
        }

        const mailOptions = {
            from: `"${hospitalName}" <${process.env.EMAIL_USER}>`,
            to: doctorEmail,
            subject: `Welcome to ${hospitalName} - Your Medicard Login Credentials`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
                        .credential-item { margin: 10px 0; }
                        .label { font-weight: bold; color: #667eea; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Medicard</h1>
                            <p>${hospitalName}</p>
                        </div>
                        <div class="content">
                            <p>Dear <strong>${doctorName}</strong>,</p>
                            
                            <p>You have been successfully added as a doctor to <strong>${hospitalName}</strong>.</p>
                            
                            ${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
                            
                            <div class="credentials">
                                <h3 style="margin-top: 0; color: #667eea;">Your Login Credentials</h3>
                                <div class="credential-item">
                                    <span class="label">Email:</span> ${doctorEmail}
                                </div>
                                <div class="credential-item">
                                    <span class="label">Password:</span> ${password}
                                </div>
                                <div class="credential-item">
                                    <span class="label">User Type:</span> Doctor
                                </div>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="http://localhost:3000/login" class="button">Login to Dashboard</a>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong> Please change your password immediately after your first login for security purposes.
                            </div>
                            
                            <p>If you have any questions or need assistance, please contact the hospital administration.</p>
                            
                            <p>Best regards,<br>
                            <strong>${hospitalName} Administration</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                            <p>&copy; ${new Date().getFullYear()} Medicard. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Dear ${doctorName},

You have been successfully added as a doctor to ${hospitalName}.
${department ? `Department: ${department}\n` : ''}
Your login credentials are:
Email: ${doctorEmail}
Password: ${password}
User Type: Doctor

Please login at: http://localhost:3000/login

⚠️ IMPORTANT: Please change your password immediately after your first login for security purposes.

If you have any questions, please contact the hospital administration.

Best regards,
${hospitalName} Administration
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        // Log credentials to console as fallback
        console.log('\n=== FALLBACK: DOCTOR CREDENTIALS ===');
        console.log(`Email: ${doctorEmail}`);
        console.log(`Password: ${password}`);
        console.log('====================================\n');
        return { success: false, error: error.message };
    }
};

export default {
    sendDoctorCredentials
};

