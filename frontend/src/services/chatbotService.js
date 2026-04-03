const FASTAPI_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:8000/api';

const chatbotService = {
  // Get list of patients for doctor
  getPatients: async (token) => {
    const response = await fetch(`${FASTAPI_URL}/patients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch patients');
    return data;
  },

  // Get specific patient data
  getPatient: async (patientId, token) => {
    const response = await fetch(`${FASTAPI_URL}/patients/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch patient');
    return data;
  },

  // Send chat message to chatbot
  sendChat: async (patientId, question, token) => {
    const response = await fetch(`${FASTAPI_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patient_id: patientId,
        question: question
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get chat response');
    return data;
  },

  // Get patient main_info
  getPatientMainInfo: async (patientId, token) => {
    // This calls the Node backend to fetch main_info.json
    const response = await fetch(`http://localhost:5000/api/patient/main-info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch main info');
    return data;
  }
};

export default chatbotService;
