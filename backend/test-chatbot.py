#!/usr/bin/env python3
"""
Test script for the Medical Chatbot API
Expected: One-paragraph summaries of patient medical history
"""

import json
import httpx
import asyncio
from pathlib import Path

BASE_URL = "http://localhost:8000"

# Use the patient ID from the extracted data
PATIENT_ID = "691b494456280f4d6ef7825d"

async def test_chat():
    """Test the chat endpoint"""
    
    async with httpx.AsyncClient() as client:
        # Test 1: Ask about medications
        print("\n=== TEST 1: Medications ===")
        response = await client.post(
            f"{BASE_URL}/chat",
            json={
                "patient_id": PATIENT_ID,
                "question": "What medications is the patient currently on?"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Patient: {data['patient']}")
            print(f"Question: {data['question']}")
            print(f"\nResponse (PARAGRAPH FORMAT):\n{data['summary']}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
        
        # Test 2: Ask about diagnoses
        print("\n" + "="*50)
        print("=== TEST 2: Diagnoses ===")
        response = await client.post(
            f"{BASE_URL}/chat",
            json={
                "patient_id": PATIENT_ID,
                "question": "What medical conditions does the patient have?"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse (PARAGRAPH FORMAT):\n{data['summary']}")
        else:
            print(f"Error: {response.status_code}")
        
        # Test 3: Ask about symptoms
        print("\n" + "="*50)
        print("=== TEST 3: Symptoms ===")
        response = await client.post(
            f"{BASE_URL}/chat",
            json={
                "patient_id": PATIENT_ID,
                "question": "What symptoms has the patient reported?"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse (PARAGRAPH FORMAT):\n{data['summary']}")
        else:
            print(f"Error: {response.status_code}")
        
        # Test 4: General summary
        print("\n" + "="*50)
        print("=== TEST 4: General Summary ===")
        response = await client.post(
            f"{BASE_URL}/chat",
            json={
                "patient_id": PATIENT_ID,
                "question": "Provide a summary of this patient's medical history"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse (PARAGRAPH FORMAT):\n{data['summary']}")
        else:
            print(f"Error: {response.status_code}")

if __name__ == "__main__":
    print("Starting Chatbot Paragraph Summary Tests...")
    print(f"Testing against: {BASE_URL}")
    print(f"Patient ID: {PATIENT_ID}")
    print("\n✓ Chatbot should now return ONE PARAGRAPH per question")
    print("✓ Responses should include patient symptoms, meds, diagnoses, tests")
    
    try:
        asyncio.run(test_chat())
    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure the chatbot API is running:")
        print("  cd backend")
        print("  python chatbot_api.py")
