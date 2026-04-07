/**
 * Test NLP extraction service
 * Usage: node test-nlp.js <file_path>
 */

import { extractInfoFromFile } from './services/nlpExtractionService.js';
import path from 'path';

const testNLP = async () => {
    // Test with a sample PDF or DOCX
    const testFile = process.argv[2];
    
    if (!testFile) {
        console.log('Usage: node test-nlp.js <file_path>');
        console.log('Example: node test-nlp.js ./uploads/reports/sample.pdf');
        process.exit(1);
    }

    console.log(`Testing NLP extraction on: ${testFile}`);
    
    try {
        const ext = path.extname(testFile).substring(1).toLowerCase();
        console.log(`File type: ${ext}`);
        
        const result = await extractInfoFromFile(testFile, ext);
        
        console.log('\n=== EXTRACTION RESULTS ===');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.symptoms && result.symptoms.length > 0) {
            console.log(`\n✅ Found ${result.symptoms.length} symptoms`);
        }
        if (result.medications && result.medications.length > 0) {
            console.log(`✅ Found ${result.medications.length} medications`);
        }
        if (result.diagnoses && result.diagnoses.length > 0) {
            console.log(`✅ Found ${result.diagnoses.length} diagnoses`);
        }
        if (result.tests && result.tests.length > 0) {
            console.log(`✅ Found ${result.tests.length} tests`);
        }
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testNLP();
