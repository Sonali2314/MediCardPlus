import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Box,
  CircularProgress,
  Typography,
  Divider,
  Avatar,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://127.0.0.1:8000';

const ChatBot = ({ open, onClose, doctorName, token }) => {
  const [step, setStep] = useState('greeting'); // 'greeting', 'selectPatient', 'chat'
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch patients when dialog opens or when stepping to selectPatient
  useEffect(() => {
    if (open && step === 'selectPatient') {
      fetchPatients();
    }
  }, [open, step]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPatients = async () => {
    try {
      setPatientLoading(true);
      const response = await fetch(`${CHATBOT_API_URL}/patients`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Chatbot patient list error: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setPatients(data);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setPatients([]);
    } finally {
      setPatientLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setStep('chat');
    
    // Initialize chat with greeting
    const initialMessage = {
      type: 'bot',
      text: `Hello! I'm analyzing ${patient.name}'s medical records. What would you like to know about this patient?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedPatient) return;

    const userMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    let currentBotMessage = { type: 'bot', text: '', timestamp: new Date() };

    try {
      const response = await fetch(`${CHATBOT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: selectedPatient._id || selectedPatient.id,
          question: inputMessage
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chatbot HTTP ${response.status}: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let completedText = '';
      let messageAppended = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        const events = chunk.split(/\n\n/).filter(Boolean);
        for (const event of events) {
          if (!event.startsWith('data:')) continue;
          const payload = event.replace(/^data:\s*/, '');
          try {
            const parsed = JSON.parse(payload);
            if (parsed.type === 'message') {
              completedText += parsed.content;

              if (!messageAppended) {
                setMessages(prev => [...prev, currentBotMessage]);
                messageAppended = true;
              }

              setMessages(prev => {
                const updated = [...prev];
                const idx = updated.length - 1;
                if (updated[idx]?.type === 'bot') {
                  updated[idx] = { ...updated[idx], text: completedText, timestamp: new Date() };
                }
                return updated;
              });
            } else if (parsed.type === 'error') {
              throw new Error(parsed.content);
            }
          } catch (err) {
            // Partial JSON chunk may happen; ignore and continue
          }
        }
      }

      const botMessage = {
        type: 'bot',
        text: completedText || 'No response received',
        timestamp: new Date()
      };
      setMessages(prev => {
        if (messageAppended) {
          const updated = [...prev];
          updated[updated.length - 1] = botMessage;
          return updated;
        }
        return [...prev, botMessage];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        text: `Error: ${error.message}. Please ensure the FastAPI chatbot server is running on port 8000.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('greeting');
    setSelectedPatient(null);
    setMessages([]);
    setInputMessage('');
    onClose();
  };

  const handleBackToPatients = () => {
    setStep('selectPatient');
    setSelectedPatient(null);
    setMessages([]);
    setInputMessage('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 2 } }}>
      {/* Header */}
      <DialogTitle sx={{ bgcolor: '#16a34a', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        🤖 Medical Assistant
      </DialogTitle>

      <DialogContent sx={{ height: '500px', display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* Greeting Step */}
        {step === 'greeting' && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              textAlign: 'center',
              py: 4
            }}
          >
            <Avatar sx={{ width: 80, height: 80, bgcolor: '#16a34a', mb: 2, fontSize: '3rem' }}>
              👨‍⚕️
            </Avatar>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
              Hello, {doctorName}!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#666', maxWidth: '90%' }}>
              Welcome to the Medical Assistant. I can help you analyze patient records and answer clinical questions about your patients.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setStep('selectPatient')}
              sx={{ mt: 2, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
            >
              Select a Patient
            </Button>
          </Box>
        )}

        {/* Patient Selection Step */}
        {step === 'selectPatient' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1rem' }}>
              Which patient would you like to consult about?
            </Typography>
            
            {patientLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress sx={{ color: '#16a34a' }} />
              </Box>
            ) : patients.length > 0 ? (
              <List sx={{ flex: 1, overflow: 'auto' }}>
                {patients.map((patient) => (
                  <ListItemButton
                    key={patient._id || patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    sx={{
                      mb: 1,
                      border: '1px solid #e5e7eb',
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#f3f4f6', borderColor: '#16a34a' }
                    }}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: '#16a34a', fontSize: '0.9rem' }}>
                      {patient.name[0]}
                    </Avatar>
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: 500 }}>{patient.name}</Typography>}
                      secondary={`Age: ${patient.age || 'N/A'} | ID: ${patient._id || patient.id}`}
                      secondaryTypographyProps={{ sx: { fontSize: '0.8rem' } }}
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: '#999', textAlign: 'center', mt: 4 }}>
                No patients found. Please add patients first.
              </Typography>
            )}
          </Box>
        )}

        {/* Chat Step */}
        {step === 'chat' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ mb: 2, pb: 1, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                  {selectedPatient?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                  Age: {selectedPatient?.age || 'N/A'}
                </Typography>
              </Box>
              <Chip size="small" label="Active" color="success" variant="outlined" />
            </Box>

            {/* Messages Container */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                mb: 2,
                p: 1,
                bgcolor: '#f9fafb',
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '85%',
                      bgcolor: message.type === 'user' ? '#16a34a' : '#e5e7eb',
                      color: message.type === 'user' ? 'white' : '#1f2937',
                      borderRadius: message.type === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    elevation={0}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4 }}>
                      {message.text}
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.7 }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: '#16a34a' }} />
                  <Typography variant="caption" sx={{ color: '#666' }}>Analyzing...</Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask a question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                sx={{
                  bgcolor: '#16a34a',
                  '&:hover': { bgcolor: '#15803d' },
                  '&:disabled': { bgcolor: '#d1d5db' },
                  minWidth: 'auto',
                  px: 2
                }}
              >
                <SendIcon />
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #e5e7eb' }}>
        {step === 'chat' && (
          <Button
            onClick={handleBackToPatients}
            startIcon={<ArrowBackIcon />}
            sx={{ color: '#16a34a' }}
          >
            Back
          </Button>
        )}
        <Button onClick={handleClose} sx={{ color: '#6b7280' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatBot;
