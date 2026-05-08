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
        # Fallback to response - will be handled dynamically
        return None

def is_greeting(question: str) -> bool:
    """
    Check if the question is a greeting
    """
    greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy', 'what\'s up']
    question_lower = question.lower().strip()
    
    # Check if the question is exactly a greeting or starts with greeting
    for greeting in greetings:
        if question_lower == greeting or question_lower.startswith(greeting):
            return True
    
    return False

def get_greeting_response() -> str:
    """
    Return a friendly greeting response with suggestions
    """
    return """Hi there! 👋 Welcome to the Medical Chatbot!

I'm here to help you understand the patient's medical history. You can ask me about:

💊 Medications - "What medications is the patient on?"
🏥 Conditions - "What medical conditions does the patient have?"
⚠️  Symptoms - "What symptoms does the patient have?"
🔬 Tests - "What medical tests have been conducted?"
📋 Summary - "Give me a summary of the patient's medical history"

Just ask your question and I'll provide you with relevant information from the patient's medical records!
    """

def generate_paragraph_summary(patient_main_info: dict, category: str = "all") -> str:
    """
    Generate a readable summary of patient's medical history with sections based on category
    
    category options: "all", "medications", "diagnoses", "symptoms", "tests"
    """
    if not patient_main_info:
        return "No patient medical history available."
    
    medical_history = patient_main_info.get('medicalHistory', {})
    personal_info = patient_main_info.get('personalInfo', {})
    
    # Extract data
    symptoms = [s.get('term', s) if isinstance(s, dict) else s for s in medical_history.get('symptoms', [])]
    medications = [m.get('term', m) if isinstance(m, dict) else m for m in medical_history.get('medications', [])]
    diagnoses = [d.get('term', d) if isinstance(d, dict) else d for d in medical_history.get('diagnoses', [])]
    tests = [t.get('term', t) if isinstance(t, dict) else t for t in medical_history.get('tests', [])]
    
    # Build formatted output with clear sections
    output = []
    
    # Patient Information Section
    patient_name = personal_info.get('fullName', 'Patient')
    age = personal_info.get('age', '')
    gender = personal_info.get('gender', '')
    blood_group = personal_info.get('bloodGroup', '')
    
    demo_parts = [patient_name]
    if gender:
        demo_parts.append(gender)
    if age:
        demo_parts.append(f"Age: {age}")
    if blood_group:
        demo_parts.append(f"Blood Type: {blood_group}")
    
    # Add last updated to patient info only
    updated_at = patient_main_info.get('updatedAt', '')
    last_updated_str = ""
    if updated_at:
        from datetime import datetime
        try:
            date_obj = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
            formatted_date = date_obj.strftime('%b %d, %Y')
            last_updated_str = f" | Last Updated: {formatted_date}"
        except:
            pass
    
    output.append("=" * 51)
    output.append("PATIENT MEDICAL SUMMARY")
    output.append("=" * 51)
    output.append(f"\n👤 PATIENT INFORMATION:\n   {', '.join(demo_parts)}{last_updated_str}\n")
    
    # Show relevant sections based on category
    if category == "all" or category == "diagnoses":
        if diagnoses:
            output.append("🏥 MEDICAL CONDITIONS:")
            for i, diagnosis in enumerate(diagnoses, 1):
                output.append(f"   {i}. {diagnosis.title()}")
            output.append("")
    
    if category == "all" or category == "medications":
        if medications:
            output.append("💊 CURRENT MEDICATIONS:")
            for i, med in enumerate(medications, 1):
                output.append(f"   {i}. {med.title()}")
            output.append("")
    
    if category == "all" or category == "symptoms":
        if symptoms:
            output.append("⚠️  SYMPTOMS:")
            for i, symptom in enumerate(symptoms, 1):
                output.append(f"   {i}. {symptom.title()}")
            output.append("")
    
    if category == "all" or category == "tests":
        if tests:
            output.append("🔬 MEDICAL TESTS CONDUCTED:")
            for i, test in enumerate(tests, 1):
                output.append(f"   {i}. {test.title()}")
            output.append("")
    
    output.append("=" * 51)
    
    return "\n".join(output)

def generate_mock_response(prompt: str, patient_main_info: dict = None) -> str:
    """
    Fallback response when API is unavailable - shows only relevant sections based on question
    """
    if not patient_main_info:
        return "No patient data available to generate summary."
    
    # Determine what category the question is asking about
    prompt_lower = prompt.lower()
    
    if "medication" in prompt_lower or "drug" in prompt_lower or "medicine" in prompt_lower:
        category = "medications"
    elif "diagnos" in prompt_lower or "condition" in prompt_lower or "disease" in prompt_lower or "history" in prompt_lower:
        category = "diagnoses"
    elif "symptom" in prompt_lower or "sign" in prompt_lower:
        category = "symptoms"
    elif "test" in prompt_lower or "result" in prompt_lower or "lab" in prompt_lower:
        category = "tests"
    else:
        category = "all"
    
    # Generate summary with only relevant sections
    return generate_paragraph_summary(patient_main_info, category)

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
        # Check if the question is a greeting
        if is_greeting(request.question):
            return ChatResponse(
                patient="Assistant",
                patient_id=request.patient_id,
                question=request.question,
                summary=get_greeting_response()
            )
        
        # Load patient main_info from filesystem
        patient_main_info = get_patient_main_info(request.patient_id)
        
        if not patient_main_info:
            logger.warning(f"No main_info found for patient {request.patient_id}, continuing without extracted data")
        
        # Get patient name from main_info if available
        if patient_main_info:
            patient_name = patient_main_info.get('personalInfo', {}).get('fullName', 'Patient')
        else:
            patient_name = 'Patient'
        
        # Determine question category to show only relevant info
        question_lower = request.question.lower()
        if "medication" in question_lower or "drug" in question_lower or "medicine" in question_lower:
            category = "medications"
        elif "diagnos" in question_lower or "condition" in question_lower or "disease" in question_lower or "history" in question_lower:
            category = "diagnoses"
        elif "symptom" in question_lower or "sign" in question_lower:
            category = "symptoms"
        elif "test" in question_lower or "result" in question_lower or "lab" in question_lower:
            category = "tests"
        else:
            category = "all"
        
        # Generate paragraph summary of medical history based on question category
        medical_history_summary = generate_paragraph_summary(patient_main_info, category) if patient_main_info else "No extracted medical data available"
        
        # Create medical-focused prompt
        system_prompt = """You are a medical AI assistant helping doctors analyze patient records. 
Provide concise responses in paragraph format focusing on clinically relevant information.
Be specific and reference the medical data provided.
If information is not available in the patient records, state so clearly."""
        
        full_prompt = f"""{system_prompt}

Patient Medical History Summary:
{medical_history_summary}

Doctor's Question: {request.question}

Please provide a response based on the patient's medical history:"""

        logger.info(f"Processing chat request for patient {request.patient_id}")
        
        # Query HuggingFace API
        response_text = query_huggingface(full_prompt)
        
        # If API fails or returns None, use actual patient data
        if not response_text:
            response_text = generate_mock_response(request.question, patient_main_info)
        
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
