
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

let browser, context, page;
let passed = 0, failed = 0;

const logSuccess = (msg) => console.log(`✅ ${msg}`);
const logFailure = (msg) => console.log(`❌ ${msg}`);

async function testPhotoHandling() {
  console.log('\n🔍 Testing Photo Handler');
  console.log('===================================\n');

  try {
    // Test upload directory exists and is writable
    const uploadDir = path.join(process.cwd(), 'client/public/uploads');
    assert(fs.existsSync(uploadDir), 'Upload directory exists');
    await fs.promises.access(uploadDir, fs.constants.W_OK);
    logSuccess('Upload directory check passed');
    passed++;

    // Test file upload endpoint
    const testFile = path.join(process.cwd(), 'client/public/assets/VMB_LOGO.png');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));

    console.log('Testing upload endpoint with file:', testFile);
    const uploadResponse = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    });

    assert(uploadResponse.ok, 'Upload endpoint should respond successfully');
    const uploadResult = await uploadResponse.json();
    assert(uploadResult.url, 'Upload response should include file URL');
    logSuccess('Photo upload test passed');
    passed++;

    // Test uploaded file is accessible
    const filePath = path.join(process.cwd(), 'client/public', uploadResult.url);
    assert(fs.existsSync(filePath), 'Uploaded file should exist');
    logSuccess('File accessibility test passed');
    passed++;

    // Test the salon update with photo endpoint
    const updateResponse = await fetch('http://localhost:5000/api/salons/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ownerPhotoUrl: uploadResult.url
      })
    });

    assert(updateResponse.ok, 'Salon update endpoint should respond successfully');
    const updatedSalon = await updateResponse.json();
    assert(updatedSalon.ownerPhotoUrl === uploadResult.url, 'Salon should be updated with new photo URL');
    logSuccess('Salon photo update test passed');
    passed++;

  } catch (error) {
    logFailure(`Test failed: ${error.message}`);
    failed++;
    console.error(error);
  }

  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

async function runTests() {
  try {
    await testPhotoHandling();
  } catch (error) {
    console.error('Test runner failed:', error);
    process.exit(1);
  }
}

runTests();
