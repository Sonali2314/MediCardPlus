# Medical Chatbot Integration Setup

## Overview

The Medical Chatbot integrates with the patient's extracted medical data (`main_info.json`) to provide AI-powered clinical insights to doctors.

## Architecture

### Components

1. **Frontend (React)** - Doctor Dashboard with ChatBot component
2. **Node.js Backend** - Patient data management and main_info serving
3. **FastAPI Backend** - Medical Chatbot processing with HuggingFace LLM integration
4. **Patient Data** - main_info.json stored per patient (extracted from uploaded documents)

### Data Flow

```
Doctor Opens ChatBot
  ↓
Select Patient
  ↓
Fetch Patient's main_info.json (from Node backend)
  ↓
Send Question to FastAPI Chatbot
  ↓
FastAPI loads main_info and creates prompt for LLM
  ↓
HuggingFace LLM processes medical context + question
  ↓
Display Response in Chat UI
```

## Setup Instructions

### 1. Install FastAPI Dependencies

```bash
cd backend
pip install -r chatbot_requirements.txt
```

### 2. Configure HuggingFace API Token

Get your free API token from: https://huggingface.co/settings/tokens

Set environment variable:

```bash
# Windows
set HF_API_TOKEN=your_token_here

# Linux/Mac
export HF_API_TOKEN=your_token_here
```

Or add to `.env` file:

```
HF_API_TOKEN=your_token_here
```

### 3. Start the FastAPI Chatbot Server

```bash
cd backend
python chatbot_api.py
```

Server will run on: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs` (Swagger UI)

### 4. Ensure Node.js Backend is Running

The FastAPI server needs to access patient data from the Node backend:

```bash
cd backend
npm install
npm start
```

Node backend: `http://localhost:5000`

### 5. Update Frontend Environment Variables

Add to `.env`:

```
REACT_APP_CHATBOT_API_URL=http://localhost:8000/api
REACT_APP_NODE_API_URL=http://localhost:5000/api
```

Or add to `.env.local`:

```
REACT_APP_CHATBOT_API_URL=http://localhost:8000/api
```

## Features

### Chat Interface

1. **Greeting** - "Hello, [Doctor Name]"
2. **Patient Selection** - Choose from doctor's patient list
3. **Medical Context** - Automatically loads patient's main_info.json with:
   - Extracted symptoms
   - Medications (with first/last detection dates)
   - Diagnoses
   - Labs and tests
   - Medical notes

4. **Smart Responses** - LLM provides clinical insights using:
   - Patient's actual medical history
   - Current medications and conditions
   - Previous diagnoses and findings

### Example Questions

- "What are the patient's current medications?"
- "Summarize the patient's medical history"
- "What diagnoses has this patient had?"
- "Are there any concerning symptoms?"
- "What tests are recommended for this patient?"

## API Endpoints

### FastAPI (Port 8000)

**POST /chat**

```json
{
  "patient_id": "patient_objid",
  "question": "What is the patient's medical history?"
}
```

Response:

```json
{
  "patient": "John Doe",
  "patient_id": "patient_objid",
  "question": "...",
  "summary": "..."
}
```

**GET /health**

- Health check endpoint

### Node.js Backend (Port 5000)

**GET /api/patients/list**

- Returns list of patients for logged-in doctor
- Requires authorization

**GET /api/patient/main-info**

- Returns patient's main_info.json
- Requires patient authentication

## Troubleshooting

### FastAPI Server Won't Start

- Check if Port 8000 is available
- Verify HF_API_TOKEN environment variable is set
- Check Python version (3.8+)

### Chatbot Not Responding

- Verify FastAPI server is running: `http://localhost:8000/health`
- Check HuggingFace API token validity
- Check network connectivity to api-inference.huggingface.co
- Review server logs for errors

### Patient Data Not Loading

- Verify patient has uploaded medical reports
- Check that main_info.json exists: `backend/uploads/patient-data/{patientId}/main_info.json`
- Ensure Node.js backend is running on port 5000

### CORS Issues

- FastAPI has CORS enabled for all origins (development)
- For production, update CORS settings in `chatbot_api.py`

## Production Considerations

### Security

- [ ] Implement proper authentication between FastAPI and Node backend
- [ ] Use API keys instead of bearer tokens
- [ ] Validate patient access (doctor can only see their patients)
- [ ] Encrypt API communications (HTTPS)
- [ ] Rate limit API endpoints

### Performance

- [ ] Add caching for patient main_info.json
- [ ] Implement message history pagination
- [ ] Add response streaming for long generations
- [ ] Use a production-grade LLM service (not free tier)

### Data Privacy

- [ ] HIPAA compliance review
- [ ] Audit logging for all chat queries
- [ ] Data retention policies
- [ ] Patient consent for AI analysis

## Files

### New Files Created

- `backend/chatbot_api.py` - FastAPI chatbot server
- `backend/chatbot_requirements.txt` - Python dependencies
- `frontend/src/services/chatbotService.js` - Frontend service for chatbot API
- `frontend/src/components/Dashboard/doctor/ChatBot.jsx` - ChatBot component
- `backend/CHATBOT_SETUP.md` - This file

### Modified Files

- `frontend/src/components/Dashboard/doctor/DoctorDashboard.js` - Added ChatBot integration
- `backend/routes/patientRoutes.js` - Added /patient/list endpoint

## Testing

### Test the Chatbot

1. Start Node backend: `npm start`
2. Start FastAPI server: `python chatbot_api.py`
3. Open doctor dashboard
4. Click the medical chatbot icon (green SmartToy icon)
5. Select a patient
6. Ask a question about the patient's medical history
7. Verify response uses actual patient data

### Test API Directly

```bash
# Get swagger docs
curl http://localhost:8000/docs

# Test health
curl http://localhost:8000/health

# Test chat (requires valid patient_id with main_info.json)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "507f1f77bcf86cd799439011",
    "question": "What medications is the patient on?"
  }'
```

## Future Enhancements

1. **Multi-turn Conversation** - Maintain context between messages
2. **Medical Literature Integration** - Reference clinical guidelines
3. **Export Chat** - Save conversations as notes
4. **Prescription Generation** - AI-assisted prescription drafting
5. **Differential Diagnosis** - AI suggestions based on symptoms
6. **Drug Interaction Checker** - Warn about potential interactions
7. **Custom LLM** - Fine-tune on medical data
8. **Offline Mode** - Fallback when LLM is unavailable

## Support

For issues:

1. Check logs: `backend/logs/` (if configured)
2. Verify all services are running
3. Test API endpoints with curl/Postman
4. Check browser console for frontend errors
