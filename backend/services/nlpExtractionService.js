import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Python NLP service
const PYTHON_NLP_SERVICE = path.join(__dirname, 'nlpService.py');

// Determine Python executable path
let PYTHON_EXECUTABLE = 'python';
if (process.platform === 'win32') {
    // On Windows, try to use the full path to ensure packages are found
    PYTHON_EXECUTABLE = 'python';
} else {
    PYTHON_EXECUTABLE = 'python3';
}

/**
 * Call Python NLP service to extract medical information from a file
 * @param {string} filePath - Path to the medical file
 * @param {string} fileType - File extension (pdf, docx, doc, jpg, etc)
 * @returns {Object} Extracted medical information
 */
const extractInfoFromFile = async (filePath, fileType) => {
    return new Promise((resolve) => {
        console.log(`[NLP] Processing ${fileType} file: ${filePath}`);

        // Build command with properly quoted paths for Windows
        const quotedFilePath = `"${filePath}"`;
        const quotedPythonScript = `"${PYTHON_NLP_SERVICE}"`;
        const command = `${PYTHON_EXECUTABLE} ${quotedPythonScript} ${quotedFilePath}`;
        
        console.log(`[NLP] Executing command: ${command}`);

        // Use exec instead of spawn to better handle Windows paths with spaces
        exec(command, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
            console.log(`[NLP] Process stderr: ${stderr}`);
            console.log(`[NLP] Process stdout: ${stdout}`);
            
            try {
                if (error && !stdout) {
                    console.error(`[NLP] Command error: ${error.message}`);
                    return resolve({
                        symptoms: [],
                        medications: [],
                        diagnoses: [],
                        tests: [],
                        rawTextLength: 0,
                        extractionError: `Command error: ${error.message}`,
                        extractedAt: new Date()
                    });
                }

                if (!stdout || stdout.trim().length === 0) {
                    console.error(`[NLP] No output from Python script`);
                    console.error(`[NLP] Stderr: ${stderr}`);
                    
                    return resolve({
                        symptoms: [],
                        medications: [],
                        diagnoses: [],
                        tests: [],
                        rawTextLength: 0,
                        extractionError: `No output from Python: ${stderr || 'Unknown error'}`,
                        extractedAt: new Date()
                    });
                }

                // Parse JSON output
                console.log(`[NLP] Parsing output...`);
                const result = JSON.parse(stdout);

                if (result.success) {
                    const extractedData = result.extracted_data;
                    console.log(`[NLP] ✅ Extraction successful - Found: ${extractedData.symptoms?.length || 0} symptoms, ${extractedData.medications?.length || 0} medications, ${extractedData.diagnoses?.length || 0} diagnoses, ${extractedData.tests?.length || 0} tests`);
                    
                    resolve({
                        symptoms: extractedData.symptoms || [],
                        medications: extractedData.medications || [],
                        diagnoses: extractedData.diagnoses || [],
                        tests: extractedData.tests || [],
                        rawTextLength: extractedData.raw_text_length || 0,
                        extractedAt: new Date()
                    });
                } else {
                    console.warn(`[NLP] ❌ Extraction failed: ${result.error}`);
                    resolve({
                        symptoms: [],
                        medications: [],
                        diagnoses: [],
                        tests: [],
                        rawTextLength: 0,
                        extractionError: result.error || 'Unknown error',
                        extractedAt: new Date()
                    });
                }
            } catch (parseError) {
                console.error(`[NLP] Failed to parse Python output: ${parseError.message}`);
                console.error(`[NLP] Raw stdout: ${stdout}`);
                console.error(`[NLP] Raw stderr: ${stderr}`);
                
                resolve({
                    symptoms: [],
                    medications: [],
                    diagnoses: [],
                    tests: [],
                    rawTextLength: 0,
                    extractionError: `Parse error: ${parseError.message}`,
                    extractedAt: new Date()
                });
            }
        });
    });
};

export { extractInfoFromFile };