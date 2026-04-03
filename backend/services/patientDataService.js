import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const patientDataDir = path.join(__dirname, '../uploads/patient-data');

// ---------------------------------------------------------------------------
// Directory helpers
// ---------------------------------------------------------------------------

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const getPatientDir   = (patientId) => path.join(patientDataDir, patientId);
const getMainInfoPath = (patientId) => {
    const dir = getPatientDir(patientId);
    ensureDir(dir);
    return path.join(dir, 'main_info.json');
};

// ---------------------------------------------------------------------------
// Initial structure
// ---------------------------------------------------------------------------

/**
 * Each medical entry is stored as:
 * {
 *   term:      string,           // e.g. "hypertension"
 *   context:   string,           // sentence snippet from source doc
 *   sources:   string[],         // list of upload filenames that mention it
 *   firstSeen: ISO string,
 *   lastSeen:  ISO string
 * }
 *
 * This way merging across multiple uploads is clean and auditable.
 */
const getInitialMainInfo = (patientId, patientData = {}) => ({
    patientId,
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
    version:    1,
    personalInfo: {
        fullName:    patientData.fullName    || '',
        email:       patientData.email       || '',
        dateOfBirth: patientData.dateOfBirth || '',
        gender:      patientData.gender      || '',
        bloodGroup:  patientData.bloodGroup  || '',
        phoneNumber: patientData.phoneNumber || ''
    },
    medicalHistory: {
        symptoms:    [],
        medications: [],
        diagnoses:   [],
        tests:       [],
        conditions:  []   // reserved for doctor-confirmed conditions
    },
    uploadHistory: []
});

// ---------------------------------------------------------------------------
// Load / Save
// ---------------------------------------------------------------------------

const loadMainInfo = (patientId, patientData) => {
    ensureDir(patientDataDir);
    const filePath = getMainInfoPath(patientId);

    if (fs.existsSync(filePath)) {
        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(raw);
        } catch (err) {
            console.error(`Corrupt main_info.json for ${patientId} — reinitialising:`, err.message);
        }
    }

    return getInitialMainInfo(patientId, patientData);
};

const saveMainInfo = (patientId, mainInfo) => {
    ensureDir(patientDataDir);
    const filePath = getMainInfoPath(patientId);

    // Atomic-ish write: write to a temp file, then rename
    const tmp = filePath + '.tmp';
    try {
        mainInfo.updatedAt = new Date().toISOString();
        mainInfo.version   = (mainInfo.version || 0) + 1;

        fs.writeFileSync(tmp, JSON.stringify(mainInfo, null, 2), 'utf-8');
        fs.renameSync(tmp, filePath);
        return true;
    } catch (err) {
        console.error(`Failed to save main_info for ${patientId}:`, err.message);
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
        throw err;
    }
};

// ---------------------------------------------------------------------------
// Merge logic
// ---------------------------------------------------------------------------

/**
 * Merge a single category (symptoms / medications / diagnoses / tests).
 *
 * extractedItems:  Array<string> or Array<{ term: string, context: string }>  (from extractorService)
 * existingItems:   Array<{ term, context, sources, firstSeen, lastSeen }>
 * sourceFileName:  string  — the upload filename, stored per-term for audit trail
 */
const mergeCategory = (existingItems, extractedItems, sourceFileName, uploadDate) => {
    const updated = [...existingItems];

    // Handle both string arrays and object arrays
    const items = (extractedItems || []).map(item => {
        if (typeof item === 'string') {
            return { term: item, context: '' };
        }
        return item;
    });

    for (const { term, context } of items) {
        if (!term) continue; // Skip empty terms
        
        const existing = updated.find(e => e.term && e.term.toLowerCase() === term.toLowerCase());

        if (existing) {
            // Update last-seen and add source if not already listed
            existing.lastSeen = uploadDate;
            if (!existing.sources.includes(sourceFileName)) {
                existing.sources.push(sourceFileName);
            }
            // Overwrite context only if the new one is longer / richer
            if (context && context.length > (existing.context || '').length) {
                existing.context = context;
            }
        } else {
            updated.push({
                term,
                context:   context || '',
                sources:   [sourceFileName],
                firstSeen: uploadDate,
                lastSeen:  uploadDate
            });
        }
    }

    return updated;
};

/**
 * Merge all extracted categories into mainInfo and record the upload.
 */
const mergeExtractedInfo = (mainInfo, extractedData, uploadMetadata) => {
    if (!mainInfo.medicalHistory) {
        mainInfo.medicalHistory = {
            symptoms: [], medications: [], diagnoses: [], tests: [], conditions: []
        };
    }

    const uploadDate = uploadMetadata.uploadDate || new Date().toISOString();
    const fileName   = uploadMetadata.fileName   || 'unknown';

    const categories = ['symptoms', 'medications', 'diagnoses', 'tests'];

    for (const cat of categories) {
        const incoming = extractedData[cat] || [];
        mainInfo.medicalHistory[cat] = mergeCategory(
            mainInfo.medicalHistory[cat] || [],
            incoming,
            fileName,
            uploadDate
        );
    }

    // Record upload in history
    if (!mainInfo.uploadHistory) mainInfo.uploadHistory = [];
    mainInfo.uploadHistory.push({
        fileName:      uploadMetadata.fileName,
        originalName:  uploadMetadata.originalName,
        uploadDate,
        rawTextLength: extractedData.rawTextLength || 0,
        extractionError: extractedData.extractionError || null,
        counts: {
            symptoms:    (extractedData.symptoms    || []).length,
            medications: (extractedData.medications || []).length,
            diagnoses:   (extractedData.diagnoses   || []).length,
            tests:       (extractedData.tests        || []).length
        }
    });

    return mainInfo;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load patient record, merge new extracted data, save and return updated record.
 * Called once per file upload.
 */
const updatePatientMainInfo = (patientId, extractedData, uploadMetadata, patientData) => {
    if (!patientId) throw new Error('patientId is required');

    try {
        let mainInfo = loadMainInfo(patientId, patientData);
        mainInfo     = mergeExtractedInfo(mainInfo, extractedData, uploadMetadata);
        saveMainInfo(patientId, mainInfo);
        return mainInfo;
    } catch (err) {
        console.error(`updatePatientMainInfo failed for ${patientId}:`, err.message);
        throw err;
    }
};

/**
 * Retrieve a patient's full record. Returns null if not found.
 */
const getPatientMainInfo = (patientId) => {
    if (!patientId) throw new Error('patientId is required');

    ensureDir(patientDataDir);
    const filePath = getMainInfoPath(patientId);

    if (!fs.existsSync(filePath)) return null;

    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error(`Failed to read main_info for ${patientId}:`, err.message);
        throw err;
    }
};

export {
    loadMainInfo,
    saveMainInfo,
    mergeExtractedInfo,
    updatePatientMainInfo,
    getPatientMainInfo,
    getInitialMainInfo
};