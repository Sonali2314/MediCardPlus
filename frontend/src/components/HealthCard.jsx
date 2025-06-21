import React from 'react';
import PropTypes from 'prop-types';
import { QRCodeCanvas } from 'qrcode.react';

const HealthCard = ({ patientData, allergies }) => {
  if (!patientData) return <div>Loading...</div>;

  const { patientId, fullName, age, gender, bloodGroup, emergencyContact } = patientData;

  // Prepare allergies summary
  const allergySummary = allergies && allergies.length > 0
    ? allergies.slice(0, 3).map(a => a.name).join(', ') 
    : 'None recorded';

  return (
    <div
      className="health-card-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // align to top, not center
        minHeight: 400,
        minWidth: 350,
        width: '100%',
        height: '100%',
        marginTop: 40 // add margin above the card
      }}
    >
      <div
        className="health-card"
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          padding: 24,
          minWidth: 320,
          maxWidth: 400,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div className="health-card-header" style={{ marginBottom: 16, textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>Digital Health Card</h2>
          <span className="patient-id" style={{ color: '#888', fontSize: 14 }}>ID: {patientId}</span>
        </div>
        <div className="health-card-content" style={{ width: '100%', marginBottom: 16 }}>
          <div className="health-card-photo" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {patientData.profilePicture ? (
              <img
                src={patientData.profilePicture}
                alt={fullName}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
              />
            ) : (
              <div className="placeholder-avatar" style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#ecf0f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: '#888', fontWeight: 700, border: '2px solid #eee'
              }}>
                {fullName.charAt(0)}
              </div>
            )}
          </div>
          <div className="health-card-details" style={{ fontSize: 15 }}>
            <div className="detail-row"><span className="label">Name:</span> <span className="value">{fullName}</span></div>
            <div className="detail-row"><span className="label">Age/Gender:</span> <span className="value">{age} / {gender}</span></div>
            <div className="detail-row"><span className="label">Blood Group:</span> <span className="value">{bloodGroup}</span></div>
            <div className="detail-row"><span className="label">Allergies:</span> <span className="value">{allergySummary}</span></div>
            <div className="detail-row"><span className="label">Emergency Contact:</span> <span className="value">
              {emergencyContact?.name ? `${emergencyContact.name} (${emergencyContact.phone})` : 'Not provided'}
            </span></div>
          </div>
        </div>
        <div className="health-card-qr" style={{ margin: '18px 0', textAlign: 'center' }}>
          <QRCodeCanvas value={`patient:${patientId}`} size={100} />
          <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Scan for complete medical record</p>
        </div>
        <div className="health-card-footer" style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 10 }}>
          <p style={{ margin: 0 }}>In case of emergency, please contact the nearest hospital</p>
          <p style={{ margin: 0 }}>This card is issued by Medi Card+</p>
        </div>
      </div>
    </div>
  );
};
HealthCard.propTypes = {
  patientData: PropTypes.shape({
    patientId: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
    gender: PropTypes.string.isRequired,
    bloodGroup: PropTypes.string,
    emergencyContact: PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string
    }),
    profilePicture: PropTypes.string,
  }).isRequired,
  allergies: PropTypes.array
};

export default HealthCard;