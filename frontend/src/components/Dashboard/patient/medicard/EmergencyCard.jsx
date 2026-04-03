import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './MedicardPanel.css';

export default function EmergencyCard({ dashboardData, emergencyCardRef, emergencyQrPayload }) {
  const age = dashboardData.dateOfBirth ?
    Math.max(0, new Date().getFullYear() - new Date(dashboardData.dateOfBirth).getFullYear()) :
    null;

  return (
    <div className="patient-emergency-card" ref={emergencyCardRef}>
      <div className="card-header">
        <span className="card-brand">Medicard</span>
        <span className="card-id">#{dashboardData._id?.slice(-6) || '000000'}</span>
      </div>
      <div className="card-body">
        <div className="card-info">
          <h2>{dashboardData.fullName || 'Patient'}</h2>
          <p className="card-meta">DOB: {dashboardData.dateOfBirth ? new Date(dashboardData.dateOfBirth).toLocaleDateString() : 'N/A'}{age !== null ? ` · Age ${age}` : ''}</p>
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
              <span className="label">Condition</span>
              <span className="value">{dashboardData.condition || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Last Visit</span>
              <span className="value">{dashboardData.lastVisit || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Contact</span>
              <span className="value">{dashboardData.phoneNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Email</span>
              <span className="value email-value">{dashboardData.email || 'N/A'}</span>
            </div>
          </div>
          <div className="card-emergency-note">Carry this card at all times. Scan QR for full medical details.</div>
        </div>
        <div className="card-qr">
          <QRCodeCanvas value={emergencyQrPayload} size={140} level="H" bgColor="#ffffff" fgColor="#1a1a1a" includeMargin />
          <span className="qr-caption">Scan for emergency info</span>
        </div>
      </div>
    </div>
  );
}