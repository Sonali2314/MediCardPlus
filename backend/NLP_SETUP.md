# NLP Extraction Setup Guide

## Requirements

### Python Environment

The NLP extraction service requires Python 3.7+ and PyPDF2 for PDF text extraction.

## Installation Steps

### 1. Install Python (if not already installed)

- **Windows**: Download from [python.org](https://www.python.org/downloads/)
  - Make sure to check "Add Python to PATH" during installation
  - Verify: Open CMD and run `python --version`

### 2. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Verify Installation

```bash
python backend/services/nlpService.py "path/to/test.pdf"
```

You should see JSON output with extracted medical data.

## How It Works

1. **File Upload** → Frontend sends PDF via `dashboardService.uploadReport()`
2. **Backend Route** → Node.js route handler calls Python NLP service
3. **Python Processing** →
   - Extracts text from PDF using PyPDF2
   - Matches medical keywords (symptoms, medications, diagnoses, tests)
   - Returns JSON with extracted data
4. **Main Info Update** → Backend saves extracted data to `main_info.json`

## Troubleshooting

### Python Not Found

If you get "python not found" error:

- Reinstall Python and ensure "Add Python to PATH" is checked
- Try using `python3` instead of `python`

### Import Errors

```bash
pip install --upgrade PyPDF2
```

### No Text Extracted

- Ensure your PDF has selectable text (not scanned image)
- Check the PDFfile is not corrupted
- Verify medical keywords are in the document

## Testing

Test the extraction manually:

```bash
cd backend
python services/nlpService.py "./uploads/reports/path-to-report.pdf"
```
