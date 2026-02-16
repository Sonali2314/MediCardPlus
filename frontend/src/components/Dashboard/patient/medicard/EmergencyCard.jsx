import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './MedicardPanel.css';

export default function EmergencyCard({ dashboardData, emergencyCardRef, emergencyQrPayload }) {
  return (
    <div className="patient-emergency-card" ref={emergencyCardRef}>
      <div className="card-header">
        <span className="card-brand">Medicard</span>
        <span className="card-id">#{dashboardData._id?.slice(-6) || '000000'}</span>
      </div>
      <div className="card-body">
        <div className="card-info">
          <h2>{dashboardData.fullName || 'Patient'}</h2>
          <p className="card-meta">DOB: {dashboardData.dateOfBirth ? new Date(dashboardData.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
          <div className="card-grid">
            <div>
              <span className="label">Blood Group</span>
              <span className="value">{dashboardData.bloodGroup || 'Unknown'}</span>
            </div>
            <div>
              <span className="label">Gender</span>
              <span className="value">{dashboardData.gender || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Contact</span>
              <span className="value">{dashboardData.phoneNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Email</span>
              <span className="value">{dashboardData.email || 'N/A'}</span>
            </div>
          </div>
          <div className="card-emergency-note">Carry this card at all times. Scan QR for full medical details.</div>
        </div>
        <div className="card-qr">
          <QRCodeCanvas value={emergencyQrPayload} size={128} level="H" bgColor="#ffffff" fgColor="#1a1a1a" includeMargin />
          <span className="qr-caption">Scan for emergency info</span>
        </div>
      </div>
    </div>
  );
}
