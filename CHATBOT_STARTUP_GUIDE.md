# 🚀 COMPLETE STARTUP GUIDE - MEDICARD CHATBOT

## Prerequisites Check

Before starting, verify you have:

```powershell
# Check Python
python --version    # Should be 3.8+
pip --version

# Check Node
node --version      # Should be 14+
npm --version
```

---

## Step 1: Install All Dependencies

### Backend Python Packages
```powershell
cd D:\MediCardPlus\MediCard-Chatbot\backend
pip install fastapi uvicorn pydantic requests python-dotenv python-multipart
```

### Frontend Node Packages (if not done)
```powershell
cd D:\MediCardPlus\frontend
npm install lucide-react
```

### Main Backend Node Packages (if not done)
```powershell
cd D:\MediCardPlus\backend
npm install
```

---

## Step 2: Verify Configuration Files

### ✅ Check `MediCard-Chatbot/backend/.env`
```
```
If empty or missing, get a token from: https://huggingface.co/settings/tokens

### ✅ Check `frontend/.env`
```
REACT_APP_CHATBOT_API_URL=http://127.0.0.1:8000
REACT_APP_API_URL=http://localhost:5000/api
```

### ✅ Check Patient Data Exists
```powershell
ls D:\MediCardPlus\backend\uploads\patient-data\
# Should show: 69cfbfb9a559bbb7feb65d06
```

---

## Step 3: Start All 3 Services

### 🟢 Terminal 1: Express Backend (Port 5000)

```powershell
cd D:\MediCardPlus\backend
npm run dev
```

**Wait for:**
```
✅ Medicard backend running on http://localhost:5000
✅ MongoDB Connected: localhost
```

### 🟡 Terminal 2: FastAPI Chatbot (Port 8000)

```powershell
cd D:\MediCardPlus\MediCard-Chatbot\backend
python run_server.py
```

**Wait for:**
```
⚙️  STARTING SERVER...
🌐 FastAPI will run on: http://0.0.0.0:8000
INFO:     Application startup complete
```

### 🔵 Terminal 3: React Frontend (Port 3000)

```powershell
cd D:\MediCardPlus\frontend
npm start
```

**Wait for:**
```
Compiled successfully!
You can now view medicard in the browser.
Local: http://localhost:3000
```

---

## Step 4: Test the Backend (Optional but Recommended)

In a **NEW Terminal**, run:

```powershell
cd D:\MediCardPlus\MediCard-Chatbot\backend
python test_chatbot.py
```

You should see:
```
✅ TEST 1: Health Check
✅ TEST 2: Get Patients List
✅ TEST 3: Get Patient Details
✅ TEST 4: Chat Endpoint (Streaming)
```

---

## Step 5: Test in Browser

1. **Open:** http://localhost:3000
2. **Login** with patient credentials
3. **Go to:** Patient Dashboard → AI Assistant tab
4. **Select Patient:** Sonali Uttam Patil
5. **Type:** "What medications?" (or any question)
6. **Click Send**
7. **Wait** 5-30 seconds for response

---

## 🔍 If You Get an Error

Open your browser's **Developer Tools** (F12) and check the **Console** tab for messages like:

### ❌ "Backend Offline"
**Solution:** FastAPI not running → Start Terminal 2

### ❌ "Patient not found"
**Solution:** Wrong patient ID → Check you selected patient from sidebar

### ❌ Connection refused on port 8000
**Solution:** FastAPI crashed → Check Terminal 2 for errors

### ❌ "TypeError: Cannot read property 'getReader'"
**Solution:** Response streaming failed → Check browser console (F12)

---

## 🐛 Debugging Tips

### See What Chatbot Backend Is Doing
```powershell
# Look at Terminal 2 output for:
📨 Chat received: Patient=...
✅ Patient found: ...
📤 Querying HuggingFace API...
✅ Got response from HuggingFace
```

### See What Frontend Is Doing
```
# Press F12 in browser, go to Console tab
# You should see:
🚀 Sending chat request...
📨 Response status: 200
📦 Chunk received: ...
✅ Response complete:
```

### Test Each Service Individually

```powershell
# Test Express Backend
curl http://localhost:5000/
# Should return: {"ok":true,"message":"Medicard backend"}

# Test FastAPI Backend
curl http://localhost:8000/
# Should return: {"status":"running","message":"Medical Chatbot API"}

# Test Patients Endpoint
curl http://localhost:8000/patients
# Should return: [{"id":"69cfbfb9a559bbb7feb65d06","name":"Sonali Uttam Patil","age":21}]
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Browser (localhost:3000)        │
│         React Frontend                  │
│  ┌─────────────────────────────────┐   │
│  │  Patient Dashboard              │   │
│  │  └─ AI Assistant Tab (NEW!)     │   │
│  │     ├─ Select Patient           │   │
│  │     ├─ Type Question            │   │
│  │     └─ Get AI Response          │   │
│  └─────────────────────────────────┘   │
└────┬──────────────────────────────────┬─┘
     │                                   │
     │ HTTP Requests                     │ HTTP Requests
     │ (CORS Enabled)                    │ (CORS Enabled)
     │                                   │
     ▼                                   ▼
┌─────────────────────┐    ┌─────────────────────────┐
│ Express Backend     │    │ FastAPI Backend         │
│ :5000              │    │ :8000                   │
│                     │    │                         │
│ • Authentication    │    │ • Patient Data Loading  │
│ • Dashboard Data    │    │ • AI Model Integration  │
│ • Reports           │    │ • HuggingFace API       │
│ • Patient Profiles  │    │ • Streaming Responses   │
└─────────────────────┘    └─────────────────────────┘
```

---

## 🎯 Expected Behavior

### First Load
- ✅ Backend status shows "Connected" (green indicator)
- ✅ Patient list loads in sidebar
- ✅ "Select Patient" message in chat area

### After Selecting Patient
- ✅ "Selected: Sonali Uttam Patil, Age 21" message
- ✅ Quick questions buttons appear
- ✅ Input field is enabled

### After Sending Question
- ✅ User message appears on right (blue)
- ✅ Loading indicator shows (3 bouncing dots)
- ✅ Bot response appears on left (gray)
- ✅ Response includes patient's actual medical data

### Example Response
```
User: "What medications?"

Bot: **Current Medications:**

• Aspirin
• Ibuprofen
• Penicillin
```

---

## 🆘 Still Having Issues?

### Check Logs in Each Terminal

**Terminal 1 (Express):**
```
Look for: "Medicard backend running on http://localhost:5000"
```

**Terminal 2 (FastAPI):**
```
Look for:
- "INFO:     Uvicorn running on http://0.0.0.0:8000"
- "✅ Loading..." messages when you send questions
- "❌ Error..." if something fails
```

**Terminal 3 (React):**
```
Look for: "Compiled successfully!"
No error messages when you click "Send"
```

### Browser Console (F12 → Console Tab)
```
Look for messages starting with:
✅ (green) = everything working
❌ (red) = there's an error
⚠️ (yellow) = warning
```

---

## ⚡ Quick Troubleshoot

| Problem | Solution |
|---------|----------|
| "Cannot connect to 8000" | Start FastAPI: Terminal 2 |
| "Patient not found" | Select patient from sidebar first |
| "No patients loading" | Check folder exists: `D:\MediCardPlus\backend\uploads\patient-data\` |
| Port already in use | Kill process: `netstat -ano \| findstr :8000`, then `taskkill /PID {id} /F` |
| Module not found (fastapi) | Run: `pip install fastapi uvicorn pydantic requests python-dotenv` |
| CORS error | Restart FastAPI backend (Terminal 2) |
| Very slow response | HuggingFace API is slow first time (5-30 sec is normal) |

---

## 📚 Additional Resources

- FastAPI Docs: http://localhost:8000/docs (when running)
- React Docs: Check browser DevTools (F12)
- HuggingFace: https://huggingface.co/settings/tokens

---

**All set! Follow the 5 steps above and your chatbot should be working! 🎉**
