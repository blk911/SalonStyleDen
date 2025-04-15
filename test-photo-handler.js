const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let browser, context, page;
let passed = 0, failed = 0;

const logSuccess = (msg) => console.log(`✅ ${msg}`);
const logFailure = (msg) => console.log(`❌ ${msg}`);

async function testPhotoHandling() {
  console.log('\n🔍 Testing Photo Handler');
  console.log('===================================\n');

  try {
    // Test file upload directory exists
    const uploadDir = path.join(process.cwd(), 'client/public/uploads');
    assert(fs.existsSync(uploadDir), 'Upload directory exists');
    logSuccess('Upload directory check passed');
    passed++;

    // Test owner photo endpoint
    const testFile = path.join(process.cwd(), 'client/public/assets/VMB_LOGO.png');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));

    const uploadResponse = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    });

    assert(uploadResponse.ok, 'Upload endpoint responds successfully');
    const uploadResult = await uploadResponse.json();
    assert(uploadResult.url, 'Upload returns file URL');
    logSuccess('Owner photo upload test passed');
    passed++;

    // Test photo display in Hero component
    await page.goto('http://localhost:5000/salon/1');
    const img = await page.waitForSelector('img[alt="Salon Owner"]');
    assert(img, 'Owner photo displays in Hero');
    logSuccess('Photo display test passed');
    passed++;

  } catch (error) {
    logFailure(`Test failed: ${error.message}`);
    failed++;
  }

  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

async function runTests() {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  page = await context.newPage();

  try {
    await testPhotoHandling();
  } finally {
    await browser.close();
  }
}

runTests();