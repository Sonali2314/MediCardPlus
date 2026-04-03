from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
import json
from typing import Optional
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Medical Chatbot API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HuggingFace API Configuration
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "Token")
HF_API_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct"

# Path to patient data files (run from backend directory)
PATIENT_DATA_DIR = Path("./uploads/patient-data")

# Request/Response Models
class ChatRequest(BaseModel):
    patient_id: str
    question: str

class PatientInfo(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    condition: Optional[str] = None

class ChatResponse(BaseModel):
    patient: str
    patient_id: str
    question: str
    summary: str

def get_patient_main_info(patient_id: str) -> Optional[dict]:
    """
    Load patient main_info.json from filesystem
    """
    try:
        main_info_path = PATIENT_DATA_DIR / patient_id / "main_info.json"
        
        if not main_info_path.exists():
            logger.warning(f"Main info file not found for patient {patient_id}")
            return None
        
        with open(main_info_path, 'r') as f:
            data = json.load(f)
        logger.info(f"Loaded main_info for patient {patient_id}")
        return data
    except Exception as e:
        logger.error(f"Error loading main_info for patient {patient_id}: {e}")
        return None

def format_medical_history(main_info: dict) -> str:
    """
    Format patient main_info into readable medical history
    """
    if not main_info:
        return "No medical data available"
    
    history_parts = []
    
    # Add medical history
    medical_history = main_info.get('medicalHistory', {})
    
    # Add symptoms
    symptoms = medical_history.get('symptoms', [])
    if symptoms:
        symptom_list = []
        for sym in symptoms:
            if isinstance(sym, dict):
                symptom_list.append(f"- {sym.get('term', 'Unknown')} (First seen: {sym.get('firstSeen', 'N/A')}, Last seen: {sym.get('lastSeen', 'N/A')})")
            else:
                symptom_list.append(f"- {sym}")
        history_parts.append(f"**Symptoms:**\n{chr(10).join(symptom_list)}")
    
    # Add medications
    medications = medical_history.get('medications', [])
    if medications:
        med_list = []
        for med in medications:
            if isinstance(med, dict):
                med_list.append(f"- {med.get('term', 'Unknown')} (First detected: {med.get('firstSeen', 'N/A')}, Last detected: {med.get('lastSeen', 'N/A')}, Sources: {med.get('sources', ['Unknown'])})")
            else:
                med_list.append(f"- {med}")
        history_parts.append(f"**Medications:**\n{chr(10).join(med_list)}")
    
    # Add diagnoses
    diagnoses = medical_history.get('diagnoses', [])
    if diagnoses:
        diag_list = []
        for diag in diagnoses:
            if isinstance(diag, dict):
                diag_list.append(f"- {diag.get('term', 'Unknown')} (First detected: {diag.get('firstSeen', 'N/A')}, Last detected: {diag.get('lastSeen', 'N/A')})")
            else:
                diag_list.append(f"- {diag}")
        history_parts.append(f"**Diagnoses:**\n{chr(10).join(diag_list)}")
    
    # Add tests
    tests = medical_history.get('tests', [])
    if tests:
        test_list = []
        for test in tests:
            if isinstance(test, dict):
                test_list.append(f"- {test.get('term', 'Unknown')} (First detected: {test.get('firstSeen', 'N/A')}, Last detected: {test.get('lastSeen', 'N/A')})")
            else:
                test_list.append(f"- {test}")
        history_parts.append(f"**Tests:**\n{chr(10).join(test_list)}")
    
    return "\n\n".join(history_parts) if history_parts else "No extracted medical data available"

def query_huggingface(prompt: str, max_tokens: int = 512) -> str:
    """
    Query HuggingFace Inference API
    
    IMPORTANT: Get your FREE API token from https://huggingface.co/settings/tokens
    """
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 0.9,
            "return_full_text": False
        }
    }
    
    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            return result[0].get('generated_text', '')
        elif isinstance(result, dict):
            return result.get('generated_text', '')
        else:
            return str(result)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"HuggingFace API Error: {e}")
        # Fallback to mock response for demo
        return generate_mock_response(prompt)

def generate_mock_response(prompt: str) -> str:
    """
    Fallback mock response when API is unavailable or for quick testing
    """
    if "medication" in prompt.lower() or "drug" in prompt.lower():
        return """**Current Medications:**

Based on the patient's medical records:
- Current medications extracted from medical history
- Dosing information from available records
- Date of last update noted in system

**Note:** Please verify with patient for most up-to-date medication list."""
    
    elif "history" in prompt.lower() or "condition" in prompt.lower():
        return """**Medical History Summary:**

Based on the extracted medical records:
- Key diagnoses and conditions identified
- Important medical events in timeline
- Current status of chronic conditions

**Assessment:** Please consult the full medical record for complete details."""
    
    elif "symptom" in prompt.lower():
        return """**Patient Symptoms:**

Symptoms extracted from medical records:
- Documented symptoms from patient reports
- Symptom onset and timeline
- Current symptom status

**Note:** Consider collecting updated symptom information from patient."""
    
    else:
        return """**Patient Information Summary:**

Based on available medical records in the system:
- Key medical information extracted from documents
- Recent medical events and updates
- Relevant clinical history

Please specify if you need information about a particular aspect of the patient's history."""

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "running",
        "message": "Medical Chatbot API with Patient Data Integration",
        "endpoints": ["/patients", "/chat"],
        "docs": "/docs"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chatbot endpoint - analyzes patient records and answers questions
    Uses patient main_info.json extracted from medical documents
    """
    try:
        # Load patient main_info from filesystem
        patient_main_info = get_patient_main_info(request.patient_id)
        
        if not patient_main_info:
            logger.warning(f"No main_info found for patient {request.patient_id}, continuing without extracted data")
        
        # Format medical history from main_info
        medical_history_text = format_medical_history(patient_main_info) if patient_main_info else "No extracted medical data available"
        
        # Get patient name from main_info if available
        patient_name = patient_main_info.get('patientName', 'Patient') if patient_main_info else 'Patient'
        
        # Create medical-focused prompt
        system_prompt = """You are a medical AI assistant helping doctors analyze patient records. 
Provide concise, bullet-point summaries focusing on clinically relevant information.
Be specific and reference the medical data. Format your response with clear headers and bullet points.
If information is not available in the patient records, state so clearly."""
        
        full_prompt = f"""{system_prompt}

Patient: {patient_name}

Medical Records (Extracted from uploaded documents):
{medical_history_text}

Doctor's Question: {request.question}

Please provide a structured summary based on the patient's records with relevant bullet points:"""

        logger.info(f"Processing chat request for patient {request.patient_id}")
        
        # Query HuggingFace API
        response_text = query_huggingface(full_prompt)
        
        return ChatResponse(
            patient=patient_name,
            patient_id=request.patient_id,
            question=request.question,
            summary=response_text
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Medical Chatbot API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
