import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const MedicalRecordItem = ({ record }) => {
  const [expanded, setExpanded] = useState(false);

  if (!record) return null;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Sort visits by date (most recent first)
  const sortedVisits = record.visits?.sort((a, b) => 
    new Date(b.visitDate) - new Date(a.visitDate)
  ) || [];

  const getStatusClass = (status) => {
    switch(status) {
      case 'Active': return 'status-active';
      case 'Resolved': return 'status-resolved';
      case 'Chronic': return 'status-chronic';
      case 'Under Treatment': return 'status-treatment';
      default: return '';
    }
  };

  return (
    <div className="medical-record-item">
      <div className="record-header" onClick={toggleExpand}>
        <div className="record-title">
          <h3>{record.diseaseName}</h3>
          <span className={`record-status ${getStatusClass(record.status)}`}>
            {record.status}
          </span>
        </div>
        <div className="record-meta">
          <span>{sortedVisits.length} visit{sortedVisits.length !== 1 ? 's' : ''}</span>
          <span className="record-date">
            Last updated: {format(new Date(record.updatedAt), 'MMM d, yyyy')}
          </span>
          <span className="expand-icon">{expanded ? '▼' : '►'}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="record-details">
          {record.description && (
            <div className="record-description">
              <p>{record.description}</p>
            </div>
          )}
          
          <div className="visits-list">
            <h4>Visit History</h4>
            {sortedVisits.length === 0 ? (
              <p className="no-visits">No visits recorded</p>
            ) : (
              sortedVisits.map((visit, index) => (
                <div key={visit._id || index} className="visit-item">
                  <div className="visit-header">
                    <div className="visit-date">
                      <strong>{format(new Date(visit.visitDate), 'MMMM d, yyyy')}</strong>
                    </div>
                    <div className="doctor-info">
                      <span>Dr. {visit.doctor?.name || 'Unknown'}</span>
                      {visit.doctor?.specialization && (
                        <span className="specialization">{visit.doctor.specialization}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="visit-content">
                    {visit.symptoms && (
                      <div className="visit-section">
                        <h5>Symptoms</h5>
                        <p>{visit.symptoms}</p>
                      </div>
                    )}
                    
                    {visit.diagnosis && (
                      <div className="visit-section">
                        <h5>Diagnosis</h5>
                        <p>{visit.diagnosis}</p>
                      </div>
                    )}
                    
                    {visit.prescription && (
                      <div className="visit-section">
                        <h5>Prescription</h5>
                        <div className="prescription-details">
                          {visit.prescription.medications?.map((med, i) => (
                            <div key={i} className="medication">
                              <span className="med-name">{med.name}</span>
                              <span className="med-dosage">{med.dosage}, {med.frequency}, {med.duration}</span>
                              {med.instructions && <p className="med-instructions">{med.instructions}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {visit.reports && visit.reports.length > 0 && (
                      <div className="visit-section">
                        <h5>Reports</h5>
                        <div className="reports-list">
                          {visit.reports.map((report, i) => (
                            <div key={i} className="report-item">
                              <span>{report.reportType}</span>
                              <a href={report.reportFile} target="_blank" rel="noopener noreferrer">
                                View Report
                              </a>
                              <span className="report-date">
                                {format(new Date(report.reportDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {visit.notes && (
                      <div className="visit-section">
                        <h5>Doctor's Notes</h5>
                        <p>{visit.notes}</p>
                      </div>
                    )}
                    
                    {visit.followUpDate && (
                      <div className="visit-section follow-up">
                        <h5>Follow-up Date</h5>
                        <p>{format(new Date(visit.followUpDate), 'MMMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

MedicalRecordItem.propTypes = {
  record: PropTypes.shape({
    _id: PropTypes.string,
    diseaseName: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    visits: PropTypes.array,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }).isRequired
};

export default MedicalRecordItem;