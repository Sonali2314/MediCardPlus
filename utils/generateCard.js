const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a digital health card for a patient
 * @param {Object} patient - Patient document
 * @returns {Promise<String>} - Path to the generated PDF
 */
exports.generateHealthCard = async (patient) => {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.env.FILE_UPLOAD_PATH, 'cards');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate a unique filename
    const filename = `${patient.patientId}-${uuidv4().substring(0, 8)}.pdf`;
    const outputPath = path.join(outputDir, filename);
    
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(patient.patientId);
    
    // Create PDF
    const doc = new PDFDocument({
      size: 'A6',
      layout: 'landscape',
      margin: 10
    });
    
    // Pipe PDF to file
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);
    
    // Add card header
    doc.fontSize(16).text('Digital Health Card', { align: 'center' });
    doc.moveDown(0.5);
    
    // Add card border
    doc.roundedRect(10, 10, doc.page.width - 20, doc.page.height - 20, 5).stroke();
    
    // Draw horizontal line
    doc.moveTo(10, 40).lineTo(doc.page.width - 10, 40).stroke();
    
    // Patient details
    doc.fontSize(12).text(`ID: ${patient.patientId}`, 20, 50);
    doc.fontSize(12).text(`Name: ${patient.fullName}`, 20, 70);
    doc.fontSize(12).text(`Age: ${patient.age} | Gender: ${patient.gender}`, 20, 90);
    doc.fontSize(12).text(`Blood Group: ${patient.bloodGroup || 'Not Specified'}`, 20, 110);
    
    // Emergency contact
    if (patient.emergencyContact && patient.emergencyContact.name) {
      doc.fontSize(10).text('Emergency Contact:', 20, 130);
      doc.fontSize(10).text(`${patient.emergencyContact.name} (${patient.emergencyContact.relation || 'Contact'})`, 20, 145);
      doc.fontSize(10).text(`${patient.emergencyContact.phone || 'No phone'}`, 20, 160);
    } else {
      doc.fontSize(10).text('Emergency Contact: Not Specified', 20, 130);
    }
    
    // Add QR code
    doc.image(qrCodeDataUrl, doc.page.width - 110, 50, { width: 90 });
    
    // Add footer
    const currentDate = new Date();
    doc.fontSize(8).text(`Generated on: ${currentDate.toLocaleDateString()}`, { align: 'center' });
    doc.fontSize(8).text('Scan QR code to access full medical profile', { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
    // Return the path where the PDF is saved
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve(`/uploads/cards/${filename}`);
      });
      writeStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error generating health card:', error);
    throw error;
  }
};