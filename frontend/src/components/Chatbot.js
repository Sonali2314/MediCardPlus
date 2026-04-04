import React, { useState, useEffect } from 'react';
import { Send, User, Bot, Heart, Pill, Activity, FileText } from 'lucide-react';
import dashboardService from '../services/dashboardService';
import './Chatbot.css';

const Chatbot = () => {
  const [patients, setPatients] = useState({});
  const [selectedPatient, setSelectedPatient] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // FastAPI Chatbot Backend on Port 8000
  const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://127.0.0.1:8000';

  const quickQuestions = [
    { text: 'Heart disease history?', icon: Heart },
    { text: 'Current medications?', icon: Pill },
    { text: 'Recent vital signs?', icon: Activity },
    { text: 'Full summary', icon: FileText }
  ];

  // Check backend status on load
  useEffect(() => {
    console.log('🚀 Chatbot component mounted');
    console.log('🔗 Backend URL:', CHATBOT_API_URL);
    checkBackendStatus();
    fetchPatients();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('disconnected');
      console.error('Backend not reachable:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      console.log('📋 Fetching patients from chatbot backend:', CHATBOT_API_URL);
      const response = await fetch(`${CHATBOT_API_URL}/patients`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch chatbot patients:', response.status, response.statusText);
        throw new Error('Chatbot patient load failed');
      }

      const data = await response.json();
      console.log('✅ Chatbot patients:', data);

      if (Array.isArray(data) && data.length > 0) {
        const patientsObj = {};
        data.forEach(patient => { patientsObj[patient.id] = patient; });
        setPatients(patientsObj);
        return;
      }

      // Fallback to main backend patients (doctor assignment)
      console.log('ℹ️ No patients from chatbot backend, fetching from main backend...');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (!user || !user.id) {
        console.warn('⚠️ No user found in localStorage for fallback patients');
        setPatients({});
        return;
      }

      const doctorPatients = await dashboardService.getDoctorPatients(user.id, localStorage.getItem('token'));
      if (!Array.isArray(doctorPatients) || doctorPatients.length === 0) {
        console.warn('⚠️ No doctor patients from main backend');
        setPatients({});
        return;
      }

      const patientsObj = {};
      doctorPatients.forEach(patient => {
        patientsObj[patient.id] = {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          ...patient
        };
      });
      console.log('✅ Main backend patients loaded:', Object.keys(patientsObj).length);
      setPatients(patientsObj);

    } catch (error) {
      console.error('❌ Error fetching patients:', error);
      setPatients({});
    }
  };

  const generateResponse = async (question) => {
    try {
      console.log('🚀 Sending chat request...', {
        url: `${CHATBOT_API_URL}/chat`,
        patient_id: selectedPatient,
        question: question
      });

      const response = await fetch(`${CHATBOT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: selectedPatient,
          question: question
        })
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response headers:', {
        contentType: response.headers.get('content-type'),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const responseParts = [];
      let messageAdded = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          console.log('📦 Chunk received:', chunk.substring(0, 100) + '...');
          
          const lines = chunk.split('\n\n');
          
          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);
                
                if (data.type === 'message') {
                  responseParts.push(data.content);
                  
                  // Add message container on first content
                  if (!messageAdded) {
                    setMessages(prev => [...prev, { type: 'bot', content: '' }]);
                    messageAdded = true;
                  }
                  
                  const fullResponse = responseParts.join('');
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.type === 'bot') {
                      lastMessage.content = fullResponse;
                    }
                    return newMessages;
                  });
                } else if (data.type === 'error') {
                  console.error('🤖 AI Error:', data.content);
                  throw new Error(data.content);
                }
              } catch (e) {
                if (e instanceof SyntaxError) {
                  console.warn('⚠️ JSON parse error (might be partial):', dataStr.substring(0, 100));
                } else {
                  console.error('Error parsing data:', e);
                  throw e;
                }
              }
            }
          });
        }
      } finally {
        reader.releaseLock();
      }

      if (responseParts.length === 0) {
        throw new Error('No response received from server');
      }

      console.log('✅ Response complete:', responseParts.length, 'parts');
      return responseParts.join('');
    } catch (error) {
      console.error('❌ Fatal error in generateResponse:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedPatient) return;

    const userMessage = {
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      await generateResponse(input);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      const errorMessage = {
        type: 'bot',
        content: `❌ Error: ${error.message || 'Unknown error occurred'}\n\n📋 Debug Info:\nPlease check:\n• FastAPI backend running on port 8000\n• HuggingFace API token configured\n• Patient data files exist`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatient(patientId);
    setMessages([{
      type: 'system',
      content: `Selected: ${patients[patientId].name}, Age ${patients[patientId].age}`
    }]);
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected': return 'Backend Connected';
      case 'disconnected': return 'Backend Offline';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  return (
    <div className="chatbot-container">
      {/* Sidebar */}
      <div className="chatbot-sidebar">
        <div className="chatbot-header">
          <h1 className="chatbot-title">Medical AI Assistant</h1>
          <p className="chatbot-subtitle">Patient Record Analysis</p>
          
          {/* Backend Status */}
          <div className="chatbot-status">
            <div className={`status-dot ${getStatusColor()}`}></div>
            <span className="status-text">{getStatusText()}</span>
          </div>
        </div>

        {/* Patient Selection */}
        <div className="chatbot-section">
          <h2 className="chatbot-section-title">Select Patient</h2>
          <div className="patient-list">
            {Object.entries(patients).length > 0 ? (
              Object.entries(patients).map(([id, patient]) => (
                <button
                  key={id}
                  onClick={() => handlePatientSelect(id)}
                  className={`patient-button ${selectedPatient === id ? 'active' : ''}`}
                >
                  <User size={20} />
                  <div>
                    <div className="patient-name">{patient.name}</div>
                    <div className="patient-info">ID: {id.slice(0, 8)}... • Age: {patient.age}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="no-patients">
                <p>⚠️ No patients available</p>
                <p style={{ fontSize: '11px', marginTop: '8px', color: '#666' }}>
                  {backendStatus === 'connected' ? 
                    '📂 Ensure patient data \nexists in backend storage' :
                    '🔌 Connect backend first'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Questions */}
        {selectedPatient && (
          <div className="chatbot-section">
            <h2 className="chatbot-section-title">Quick Questions</h2>
            <div className="quick-questions">
              {quickQuestions.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q.text)}
                    className="quick-question-btn"
                  >
                    <Icon size={16} />
                    {q.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {backendStatus === 'disconnected' && (
          <div className="error-box">
            <p><strong>Backend Offline!</strong></p>
            <p>Start FastAPI on port 8000:</p>
            <code>python main.py</code>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="chatbot-main">
        {!selectedPatient ? (
          <div className="empty-state">
            <User size={64} />
            <h2>Select a Patient</h2>
            <p>Choose a patient from the sidebar to start</p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="messages-container">
              {messages.map((message, idx) => (
                <div key={idx} className={`message-wrapper ${message.type}`}>
                  {message.type === 'bot' && (
                    <div className="message-avatar bot">
                      <Bot size={20} />
                    </div>
                  )}
                  
                  <div className={`message-content ${message.type}`}>
                    {message.type === 'bot' ? (
                      <div className="message-text">
                        {message.content.split('\n').map((line, i) => (
                          <div key={i}>
                            {line.startsWith('**') && line.endsWith('**') ? (
                              <strong>{line.replace(/\*\*/g, '')}</strong>
                            ) : line.startsWith('•') ? (
                              <div className="bullet-point">{line}</div>
                            ) : (
                              <div>{line}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>

                  {message.type === 'user' && (
                    <div className="message-avatar user">
                      <User size={20} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="message-wrapper bot">
                  <div className="message-avatar bot">
                    <Bot size={20} />
                  </div>
                  <div className="message-content bot">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="input-area">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about patient's medical history..."
                disabled={loading || backendStatus === 'disconnected'}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || loading || backendStatus === 'disconnected'}
              >
                <Send size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
